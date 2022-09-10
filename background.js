// This is a CSS class in Kinderloop which is hosting images.
const kinderloop_gallery_class = '.nailthumb-container';

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ kinderloop_gallery_class });
});

chrome.runtime.onMessage.addListener(
  function(arg, sender, sendResponse) {
    let args=arg.collection;
    for (i in args){
      let img_url=args[i];
      try{
        saveas=img_url.replace(/[^a-zA-Z0-9]/g,'-');
      }
      catch (e){
        console.log("Error: " + e);
      }
     chrome.downloads.download({
       url: img_url,
       filename: saveas,
       saveAs: false
     });
   }
});

function sendResponse(){
}
