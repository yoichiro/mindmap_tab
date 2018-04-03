"use strict";

window.addEventListener("load", () => {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service_worker.js")
      .then(() => {
        console.log("serviceWorker registered");
      }).catch(error => {
        console.warn("serviceWorker error", error);
      });
  }
});
