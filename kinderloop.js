const getPhotos = document.getElementById("getPhotos");

getPhotos.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: getPhotosNodes,
  });
});

// The body of this function will be executed as a content script inside the
// current page
function getPhotosNodes() {
  chrome.storage.sync.get("kinderloop_gallery_class", ({ kinderloop_gallery_class }) => {
    const photos = document.querySelectorAll('.nailthumb-container');
    let photosArray = [];
    for(let k in photos){
      if(photos[k].getAttribute){
        photosArray.push(photos[k].getAttribute('href'));
    }
  }
  let param = {collection : photosArray};
  chrome.runtime.sendMessage(param);
  });
}
