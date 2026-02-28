import type { FolderItem } from '../types';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;
const REFRESH_TOKEN = import.meta.env.VITE_GOOGLE_REFRESH_TOKEN;

const APP_ROOT_FOLDER_NAME = import.meta.env.VITE_DRIVE_APP_FOLDER;
const DATA_FOLDER_NAME = import.meta.env.VITE_DRIVE_DATA_FOLDER;
const NOTES_FILE_NAME = import.meta.env.VITE_NOTES_FILE_NAME;

let cachedAccessToken: string | null = null;
let tokenExpiresAt = 0;

function extractGoogleError(data: unknown): string {
  if (!data || typeof data !== 'object') return 'Unknown Google API error.';
  const obj = data as Record<string, unknown>;
  const topError = obj.error;
  const topDescription = obj.error_description;

  if (typeof topError === 'string' && typeof topDescription === 'string') {
    return `${topError}: ${topDescription}`;
  }
  if (typeof topError === 'string') {
    return topError;
  }
  return 'Unknown Google API error.';
}

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedAccessToken && now < tokenExpiresAt) {
    return cachedAccessToken;
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const errorMessage = extractGoogleError(data);
    throw new Error(`Failed to refresh Google access token (${response.status}): ${errorMessage}`);
  }

  if (!data.access_token) {
    throw new Error('Google token response did not include access_token.');
  }

  cachedAccessToken = data.access_token;
  tokenExpiresAt = now + ((data.expires_in ?? 3600) - 60) * 1000;
  return cachedAccessToken;
}

async function findFolderByName(
  accessToken: string,
  folderName: string,
  parentId: string | null
): Promise<string | null> {
  const parentFilter = parentId ? `'${parentId}' in parents` : "'root' in parents";
  const query = encodeURIComponent(
    `${parentFilter} and name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
  );
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)&spaces=drive`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to find Drive folder "${folderName}".`);
  }

  const data = await response.json();
  return data.files?.[0]?.id ?? null;
}

async function createFolder(
  accessToken: string,
  folderName: string,
  parentId: string | null
): Promise<string> {
  const metadata: { name: string; mimeType: string; parents?: string[] } = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentId) {
    metadata.parents = [parentId];
  }

  const response = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  if (!response.ok) {
    throw new Error(`Failed to create Drive folder "${folderName}".`);
  }

  const data = await response.json();
  if (!data?.id) {
    throw new Error(`Drive did not return an id for folder "${folderName}".`);
  }
  return data.id as string;
}

async function ensureFolder(accessToken: string, folderName: string, parentId: string | null): Promise<string> {
  const foundId = await findFolderByName(accessToken, folderName, parentId);
  if (foundId) {
    return foundId;
  }
  return createFolder(accessToken, folderName, parentId);
}

async function resolveNotesFolderId(accessToken: string): Promise<string> {
  const appRootFolderId = await ensureFolder(accessToken, APP_ROOT_FOLDER_NAME, null);
  return ensureFolder(accessToken, DATA_FOLDER_NAME, appRootFolderId);
}

async function getNotesFileId(accessToken: string, notesFolderId: string): Promise<string | null> {
  const query = encodeURIComponent(
    `'${notesFolderId}' in parents and name='${NOTES_FILE_NAME}' and trashed=false`
  );
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)&spaces=drive`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to list files from Google Drive.');
  }

  const data = await response.json();
  return data.files?.[0]?.id ?? null;
}

export async function loadNotesFromDrive(): Promise<FolderItem[] | null> {
  const accessToken = await getAccessToken();
  const notesFolderId = await resolveNotesFolderId(accessToken);
  const fileId = await getNotesFileId(accessToken, notesFolderId);
  if (!fileId) return null;

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to download notes from Google Drive.');
  }

  const data = await response.json();
  return Array.isArray(data) ? (data as FolderItem[]) : null;
}

async function createNotesFile(
  accessToken: string,
  notesFolderId: string,
  items: FolderItem[]
): Promise<void> {
  const metadata = { name: NOTES_FILE_NAME, parents: [notesFolderId] };
  const formData = new FormData();
  formData.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  );
  formData.append(
    'file',
    new Blob([JSON.stringify(items)], { type: 'application/json' })
  );

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error('Failed to create notes file in Google Drive.');
  }
}

async function updateNotesFile(
  accessToken: string,
  fileId: string,
  items: FolderItem[]
): Promise<void> {
  const response = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(items),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to update notes file in Google Drive.');
  }
}

export async function saveNotesToDrive(items: FolderItem[]): Promise<void> {
  const accessToken = await getAccessToken();
  const notesFolderId = await resolveNotesFolderId(accessToken);
  const fileId = await getNotesFileId(accessToken, notesFolderId);
  if (!fileId) {
    await createNotesFile(accessToken, notesFolderId, items);
    return;
  }
  await updateNotesFile(accessToken, fileId, items);
}
