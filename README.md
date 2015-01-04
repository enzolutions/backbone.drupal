<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**

- [Usage](#usage)
- [Bower install](#bower-install)
  - [Bower command](#bower-command)
  - [Include as dependencie](#include-as-dependencie)
- [Features](#features)
  - [Cross-origin](#cross-origin)
    - [Drupal 8](#drupal-8)
      - [Auth](#auth)
    - [Drupal 7](#drupal-7)
- [ToDo](#todo)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

Backbone.Drupal is a standalone plugin to connect Marionette JS and Backbone JS applications with Drupal 7/8 to execute [RESTful](http://en.wikipedia.org/wiki/Representational_state_transfer) States to elaborate operation GET, POST, DELETE etc.

Originally Inspired in JS files from Drupal 7 Module <a href="https://drupal.org/project/backbone" target="_blank">https://drupal.org/project/backbone</a>

Backbone.Drupal has compatibility with [Backform](http://amiliaapp.github.io/backform/index.html) Drupal 8 return an object for each property if you enable this compatibility attibuttes will be flatten to an array with value property. But this feature could be used for other implementations.

Also in included in [Yeoman Marionette Drupal Generator](github.com/enzolutions/generator-marionette-drupal) if you are interested in start with a more sofisticated implementation in a [Headless Drupal](groups.drupal.org/headless-drupal) soltuion

# Usage

Check **test/index.html** for Drupal 8 example and **indexd7.html** for  Drupal 7 example.

Before to test in Drupal 8 be sure the REST Resource Content for methods Get, Post, Update , Delete and Patch has json as format and Basic Auth as Authentication method.

You can the contributed module [Rest UI](https://www.drupal.org/project/restui) I recommend use the git version until Drupal 8 get his first official release.

Your configuration must look similar to following image.

![REST UI Content](https://raw.githubusercontent.com/enzolutions/backbone.drupal/master/images/backbone.drupal_drupal8_restui_content_resource.png "REST UI Content")

## Code Sample
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

        // Set Backform Compatibility (amiliaapp.github.io/backform/index.html)
        //Backbone.Drupal.backform = true;

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

# Bower install

If you are using <a target="_blank" href="http://bower.io/">Bower</a> you can download Backbone.drupal following this instructions

## Bower command

```
$ bower install backbone.drupal
```

## Include as dependencie

If your application has a list of bower dependencies, you can include as dependency as shown below.

```
{
  "name": "YOURAPP",
  "version": "0.0.0",
  "dependencies": {
    "backbone.drupal": "~0.2.0-alpha",
  },
}

Check the releases section to verify the latest version.

```

# Features

**Authentication**: Option login with Drupal user account to enable to execute REST operation PUT, DELETE, ADD. If Cross-origin is enabled login is required for operations.

**REST**: Integration with Services Server type REST

**Models**: Created Backbone models for Nodes, Users and Comments Entities

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


**Collections**:

Right now we have two kind of collections

- Entity Collections: Enable to create to generic REST End point in Drupal to fetch list of Users, Nodes and Views.


- Generic Collections: Enable to call a Custom REST End Point in Drupal, check the following example

```
var myCollection =  Backbone.Drupal.Collection.extend({
    initialize: function() {
      console.log("initialize a Custom collection");
      this.model =  myModel;
      this.urlSource = "custon/end/point";
   }
```

##Cross-origin

Using [CORS](http://enzolutions.com/articles/2014/05/31/what-is-cross-origin-resource-sharing-cors/) we can use Drupal as Backend Server in a Domain i.e **backend.com** and use for instance a Backbone/Marionette App as Front End server in other domain i.e **frontend.com**.

### Drupal 8

Because the Drupal module [CORS](https://www.drupal.org/project/cors) doesn't have a version for Drupal 8 yet and Drupal Core won't have a native solution for that until Drupal 8.1.

I propose a <a href="https://www.drupal.org/files/issues/core-cors-headers-1869548-26.patch">patch</a> for .htacces in order to enable CORS requests using jQuery documented in [issue](https://www.drupal.org/node/1869548#comment-9120317)

In summary you only have to accept the OPTIONS requests as you can see in the following instructions to .htacces
```
# Intercept OPTIONS calls
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule .* / [R=200,L]
```

Also we have to enable REST Methdos POST, GET, OPTIONS, PATCH, DELETE and allow request from different origin. Check the instructions below.

```
<IfModule mod_headers.c>
  Header always set Access-Control-Allow-Origin "*"
  Header always set Access-Control-Allow-Methods "POST, GET, OPTIONS, PATCH, DELETE"
  Header always set Access-Control-Allow-Headers: Authorization
</IfModule>
```

Also a intructions to enable Basic Auth is required.

When issues https://www.drupal.org/node/1869548 and https://www.drupal.org/node/2237231 get resolved this implementation will be updated.

#### Auth

Drupal 8 doesn't implement yet the end point /user/login to enable remote login, this method in Drupal allow validate the credentials and request a CRS Token to be used in further request.

Right now there are only two methods of authentications Cookie (same domain) and Basic Auth for remote request, becuase this library is oriented to create a fronted 100% separate of backed the Auth process use Basic Auth.

When function Auth is called the credentials are not validated, they are just encoded using base64 and configured to use the enconded credentials in further request.

Remember the credentials travel to your backend server **encoded** NOT **encrypted** for tha reason you **MUST** use a SSL certificate in your backend site to protect your users.

### Drupal 7

In your Drupal Server you must setup <a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS" target="_blank">HTTP Access Control</a> to enable connection, below an example.

````
Access-Control-Allow-Credentials:true
Access-Control-Allow-Headers:X-CSRF-Token
Access-Control-Allow-Methods:POST,ADD,GET,PUT,DELETE,OPTIONS
Access-Control-Allow-Origin:http://localhost:8080
````

You must change the origin to use the domain you are using to run your application.

I strong recommend to use the Drupal module <a href="https://drupal.org/project/cors" target="_blank">CORS</a> to configure the HTTP Access Control

# ToDo

<ul>
  <li>Implement Collections for Taxonomies and Search</li>
  <li>Create integration with module Restws in Drupal 7</li>
  <li>Test Drupal 8 POST method and Views integrations.</li>
</ul>
