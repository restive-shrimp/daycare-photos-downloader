const getAllPhotosKinderloop = document.getElementById("getAllPhotosKinderloop");

const getTodaysPhotosKinderloop = document.getElementById("getTodaysPhotosKinderloop");

getAllPhotosKinderloop.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: getPhotosNodes,
    args: ['all']
  });
});

getTodaysPhotosKinderloop.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });


  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: getPostNodes,
    args: ['today']
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


// This function returns posts and verifies if it is today's date.
// This is initial version of the script, so the functions for photos/posts will
// be merged later on.
function getPostNodes() {
  chrome.storage.sync.get("kinderloop_gallery_class", ({ kinderloop_gallery_class }) => {
    const posts = document.querySelectorAll('.post-content');
    let postArray = [];
    let photosArray = [];
    for(let k in posts){
      if(posts[k].getAttribute){
        console.log((posts[k].querySelector('.sent').textContent).replace(/\s+/g, ''))
        if((posts[k].querySelector('.sent').textContent.replace(/\s+/g, '')).includes(('Sent on 12 wrz').replace(/\s+/g, ''))){
          console.log("Message found! ");
          let post_images = posts[k].querySelectorAll('.nailthumb-container');
          for(let j in post_images){
            if(post_images[j].getAttribute){
            photosArray.push(post_images[j].getAttribute('href'));
            }
          }
        }
    }
  }
  let param = {collection : photosArray};
  chrome.runtime.sendMessage(param);
  });
}
