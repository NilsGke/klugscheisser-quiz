const downloadFile = (file: Blob, fileName: string) => {
  const url = window.URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
};
export default downloadFile;
