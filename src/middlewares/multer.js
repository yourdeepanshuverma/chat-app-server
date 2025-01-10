import multer from "multer";

export const upload = multer({
  filesize: 1024 * 1024 * 5,
});

export const avatarUpload = upload.single("avatar");

export const attachmentsUpload = upload.array("files", 5);
