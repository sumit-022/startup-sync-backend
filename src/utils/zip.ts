import { zip } from "fflate";

export async function zipFileFromUrls(urls: string[], zipFileName: string) {
  const filePromises = urls.map(async (url) => {
    const fileName = url.split("/").pop();
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch file from ${url}`);
    }

    const buffer = await response.arrayBuffer();
    return { name: fileName, buffer };
  });

  const files = await Promise.all(filePromises);

  const zipData = await new Promise<Uint8Array>((resolve) => {
    const fileData = Object.fromEntries(
      files.map((file) => [file.name, new Uint8Array(file.buffer)])
    );

    zip(fileData, (err, result) => {
      if (err) {
        throw new Error(`Error zipping files: ${err.message}`);
      }
      resolve(result);
    });
  });

  const blob = new Blob([zipData], { type: "application/zip" });
  return blob;
}
