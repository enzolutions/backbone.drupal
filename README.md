Backbone.Drupal is a standalone plugin to connect Marionette JS and Backbone JS applications with Drupal 7

Inspired in JS files from Drupal Module <a href="https://drupal.org/project/backbone" target="_blank">https://drupal.org/project/backbone</a>

### Bower install

If you are using <a target="_blank" href="http://bower.io/">Bower</a> you can download Backbone.drupal following this instructions

#### Bower command

```
$ bower install backbone.drupal
```

#### Include as dependencie

If your application has a list of bower dependencies, you can include as dependency as shown below.

```
{
  "name": "YOURAPP",
  "version": "0.0.0",
  "dependencies": {
    "backbone.drupal": "~0.1.0-beta",
  },
}

Check the releases section to verify the latest version.

```

### Features

####Cross-origin

Enable to have Drupal as Backend in a Domain backend.com and the Backbone/Marionette App in other domain frontend.com.

##### Drupal 8

Because the mode https://www.drupal.org/project/cors doesn't have a version for Drupal 8 yet and Drupal Core still doesn't have a solution for that I did a <a href="https://www.drupal.org/files/issues/core-cors-headers-1869548-26.patch">patch</a> for .htacces to enable CORS request using jQuery documented in issue # https://www.drupal.org/node/1869548#comment-9120317

```
diff --git a/.htaccess b/.htaccess
index c32b182..b0bf563 100644
--- a/.htaccess
+++ b/.htaccess
@@ -118,6 +118,10 @@ DirectoryIndex index.php index.html index.htm
   RewriteCond %{REQUEST_URI} !core
   RewriteRule ^ %1/core/%2 [L,QSA,R=301]

+  # Intercept OPTIONS calls
+  RewriteCond %{REQUEST_METHOD} OPTIONS
+  RewriteRule .* / [R=200,L]
+
   # Pass all requests not referring directly to files in the filesystem to
   # index.php.
   RewriteCond %{REQUEST_FILENAME} !-f
@@ -165,3 +169,7 @@ DirectoryIndex index.php index.html index.htm
     </FilesMatch>
   </IfModule>
 </IfModule>
+
+Header always set Access-Control-Allow-Origin "*"
+Header always set Access-Control-Allow-Methods "POST, GET, OPTIONS, PATCH, DELETE"
+Header always set Access-Control-Allow-Headers: Authorization
```
When issues https://www.drupal.org/node/1869548 and https://www.drupal.org/node/2237231 get resolved this implementation will be updated.

More information at http://enable-cors.org/server_apache.html

##### Drupal 7

In your Drupal Server you must setup <a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS" target="_blank">HTTP Access Control</a> to enable connection, below an example.

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

You can add extra fields to modules to use as extra information in you application, these extra fields could be mark as *noSaveAttributes*. Check the following example.

````
var Property = Backbone.Drupal.Models.Node.extend({
      initialize : function(options) {
        // Setting the Id Attribute for Drupal model
        this.attributes.nid = options.property_id;
        this.noSaveAttributes = ['property_id'];

        // Extended Backbone.Drupal.Models.Node to my own service for Drupal Nodes.
        // This Rest service return absolute URL for field pictures
        this.urlSource = "node_waterbed";
       },
````

**Collections**: Created Backbone collection for Users, Nodes and Views

**REST**: Integration with Services Server type REST

### ToDo

<ul>
  <li>Implement Collections for Taxonomies and Search</li>
  <li>Create integration with module Restws in Drupal 7</li>
  <li>Test Drupal 8 POST method and Views integrations.</li>
</ul>

### Usage

Check **test/index.html** for Drupal 8 example and **indexd7.html** for  Drupal 7 example.

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
        var auth_status =  = Auth.login('admin', 'admin');

        if(auth_status) {

          // Check user retrieve

          var User = new Backbone.Drupal.Models.User({uid: 1});
          User.fetch({
            success: function (user) {
              // Check information retrived, could be used directly in a template
              console.log(user.attributes.mail);
            }
          });

          //  Check users retrive

          var Users = new Backbone.Drupal.Collections.UserIndex();
          Users.fetch({
            success: function (users) {
              // Check information retrived, could be used directly in a template
              console.log(users.models[0].attributes.uri);
            }
          });
        } else {
          alert('Auth Error');
        }
      });

    </script>

  </body>
</html>

````

Note: This plugin could be used with <a href="requirejs.org" target="_blank">RequireJS</a>.
