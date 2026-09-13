// Test stand-in for the Umami tracker (CI and local previews): records calls instead of
// sending them. Never referenced by production configuration.
(function () {
  window.__umamiEvents = [];
  window.umami = {
    track: function (name, data) {
      window.__umamiEvents.push({ name: name, data: data || {} });
    },
  };
})();
