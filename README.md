Backbone.Drupal is a standalone plugin to connect Marionette JS and Backbone JS applications with Drupal 7

Inspired in JS files from Drupal Module <a href="https://drupal.org/project/backbone" target="_blank">https://drupal.org/project/backbone</a>

### Features

**Cross-origin**: Enable to have Drupal as Backend in a Domain backend.com and the Backbone/Marionette App in other domain frontend.com.

In your Drupal Server you must setup <a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS" target="_blank">HTTP Access Control</a> to enable connection, below and example.

````
Access-Control-Allow-Credentials:true
Access-Control-Allow-Headers:X-CSRF-Token
Access-Control-Allow-Methods:POST,ADD,GET,PUT,DELETE,OPTIONS
Access-Control-Allow-Origin:http://localhost:8080
````

You must change the origin to use the domain you are using to run your application.

I strong recommend to use the Drupal module <a href="https://drupal.org/project/cors" target="_blank">CORS</a> to configure the HTTP Access Control

**Authentication**: Option login with Drupal user account to enable to execute REST operation PUT, DELETE, ADD. If Cross-origin is enabled login is required for GET operations.

**Models**: Created Backbone models for Nodes, Users, Comments Entities

**Collections**: Created Backbone collection for Users, Nodes and Views

**REST**: Integration with Services Server type REST

### ToDo

<ul>
  <li>Implement Collections for Taxonomies and Search</li>
  <li>Create integration with module Restws</li>
  <li>Create version of plugin for Drupal 8.</li>
</ul>

### Usage

````
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Backbone Drupal Library</title>
  </head>
  <body>
    <script src="./jquery.js"></script>
    <script src="./underscore.js"></script>
    <script src="./backbone.js"></script>
    <script src="./backbone.drupal.js"></script>
    <script src="./backbone.drupal.services.js"></script>
    <script>
      $(function() {
        // Set API Information
        Backbone.Drupal.restEndpoint = {
          root: 'http://onthisday/api',
          dataType: '.json'
        };
        // Define auth object, set crossDomain if is necessary
        var Auth = new Backbone.Drupal.Auth({crossDomain: true});
        // Request executed in sync mode
        // If status is token further ajax will use the proper token
        var status = Auth.login('admin', 'admin');

        console.log(status);

        /*
          Check user retrieve
        */

        var User = new Backbone.Drupal.Models.User({uid: 1});
        User.fetch({
          success: function (user) {
            // Check information retrived, could be used directly in a template
            console.log(user.attributes.mail);
          }
        });
        /*
          Check users retrive
        */
        var Users = new Backbone.Drupal.Collections.UserIndex();
        Users.fetch({
          success: function (users) {
            // Check information retrived, could be used directly in a template
            console.log(users.models[0].attributes.uri);
          }
        });
      });

    </script>

  </body>
</html>

````

Note: This plugin could be used with <a href="requirejs.org" target="_blank">RequireJS</a>.
