type ObjVal = string | number | boolean | File | Obj;
type Obj = {
  [key: string]: ObjVal | ObjVal[];
};

export function generateFormdata(
  obj: Obj,
  keyHist: string[] = [],
  formData: FormData = new FormData()
) {
  for (const key in obj) {
    const value = obj[key];

    if (typeof value === "object" && !Array.isArray(value)) {
      // Object only
      if (value instanceof File && value.name) {
        // File
        formData.append([...keyHist, key].join("."), value);
      } else {
        // Obj
        generateFormdata(value as Obj, [...keyHist, key], formData);
      }
    } else if (Array.isArray(value)) {
      // Arrays only
      value.forEach((item) => {
        if (item instanceof File) {
          if (item.name) formData.append([...keyHist, key].join("."), item);
        } else if (typeof item === "object") {
          generateFormdata(item, [...keyHist, key], formData);
        } else {
          formData.append([...keyHist, key].join("."), item);
        }
      });
    } else {
      // Everything else
      formData.append([...keyHist, key].join("."), value);
    }
  }
}

export function getFormAttachments(files: any, key: string) {
  const f = files[key];
  if (!f) return {};
  const res: { [x: string]: File & { path: string } } = {};

  if (Array.isArray(f)) {
    f.forEach((file) => {
      if (file.name) res[file.name] = file;
    });
  } else {
    if (f.name) res[f.name] = f;
  }
  return res;
}
