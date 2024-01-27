import { Readable } from "stream";

const getServiceUpload = (name: string) => {
  return strapi.plugin("upload").service(name);
};

export const uploadAndLinkDocument = async (
  buffer: Buffer,
  {
    filename,
    extension,
    mimeType,
    refId,
    ref,
    field,
  }: {
    filename: string;
    extension: string;
    mimeType: string;
    refId: string;
    ref: string;
    field: string;
  }
) => {
  const config = strapi.config.get("plugin.upload") as any;

  // add generated document
  const entity: any = {
    name: filename,
    hash: filename,
    ext: extension,
    mime: mimeType,
    size: buffer.length,
    provider: config.provider,
  };
  if (refId) {
    entity.related = [
      {
        id: refId,
        __type: ref,
        __pivot: { field },
      },
    ];
  }
  entity.getStream = () => Readable.from(buffer);
  await getServiceUpload("provider").upload(entity);

  const fileValues = { ...entity };

  const res = await strapi
    .query("plugin::upload.file")
    .create({ data: fileValues });
  return res;
};
