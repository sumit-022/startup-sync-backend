/**
 * spare controller
 */

import { factories } from "@strapi/strapi";
import { zipFileFromUrls } from "../../../utils/zip";
import { Readable } from "stream";

type Attachment = {
  id: number;
  name: string;
  alternativeText: any;
  caption: any;
  width: any;
  height: any;
  formats: any;
  hash: string;
  ext: string;
  mime: string;
  size: number;
  url: string;
  previewUrl: any;
  provider: string;
  provider_metadata: any;
  folderPath: string;
  createdAt: string;
  updatedAt: string;
};

export default factories.createCoreController(
  "api::spare.spare",
  ({ strapi }) => ({
    async getAttachments(ctx) {
      const { id } = ctx.params;
      const spare = await strapi.entityService.findOne("api::spare.spare", id, {
        populate: ["attachments"],
      });
      if (!spare || !Array.isArray(spare.attachments)) {
        return ctx.notFound();
      }
      const attachments = spare.attachments as Attachment[];
      // Create a zip file with the attachments
      const zipFile = await zipFileFromUrls(
        attachments.map((a) => a.url),
        `${spare.title}-attachments.zip`
      );

      ctx.response.set(
        "Content-disposition",
        `attachment; filename=attachments.zip`
      );
      ctx.response.set("Content-type", "application/zip");
      ctx.response.body = Readable.from(
        Buffer.from(await zipFile.arrayBuffer())
      );
    },
  })
);
