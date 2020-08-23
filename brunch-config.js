exports.config = {
  // See http://brunch.io/#documentation for docs.
  files: {
    javascripts: {
      joinTo: {
        "app.js": /^(app)/,
        "vendor.js": /^(vendor|node_modules)/
      }
    },
    stylesheets: {
      joinTo: {
        "app.css": /^(app|vendor|node_modules)/
      }
    },
    templates: {
      joinTo: "app.js"
    }
  },

  conventions: {
    // This option sets where we should place non-css and non-js assets in.
    assets: /^app\/images/
  },

  paths: {
    // Dependencies and current project directories to watch
    watched: [
      "app/javascripts",
      "app/stylesheets",
      "vendor"
    ]
  },

  // Configure your plugins
  plugins: {
    babel: {
      presets: ["@babel/preset-env", "@babel/preset-react"],
      // Do not use ES6 compiler in vendor code
      ignore: [/vendor/]
    }
  },
  npm: {
    enabled: true,
    styles: {
      "bootstrap-solarized": ["bootstrap-solarized-dark.css"],
      "toastr": ["build/toastr.min.css"]
    },
    whitelist: [
      "react", 
      "react-dom", 
      "jquery", 
      "lodash", 
      "react-autolink", 
      "react-dom", 
      "react-emoji", 
      "howler",
      "bootstrap", 
      "perfect-scrollbar", 
      "moment", 
      "toastr", 
      "socket.io-client"
    ],
    globals: {
      "_": "lodash",
      "jQuery": "jquery",
      "$": "jquery",
      "toastr": "toastr"
    }
  }
};
