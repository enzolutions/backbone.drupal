// backbone.drupal 0.1.0
//
// (c) 2014 enzo - Eduardo Garcia enzo@enzolutions
// Licensed under the MIT license.


// * TODO Add .TaxonomyCollection with support for taxonomy listings.
// * TODO Add .SearchCollection with support for search results.
// * TODO Add configurable endpoint path, loaded via Drupal.settings.
//   (will remove hard dependency on backbone_base feature)
// * TODO Add .FieldViewCollection for working with field views.

// Starts with the Backbone.Drupal. Constructor, currently a no-op
Backbone.Drupal = function() {};

// Backbone.Drupal.Auth Implement authentication against webservices
// ToDo: Validate if this method work for Drupal Restws module
Backbone.Drupal.Auth = (function(Backbone, $, _){
  function Auth(options) {
    // PUBLIC METHODS
    function initialize(options) {
      this.attributes = _.extend({}, defaults(), options);
    }

    // Set defaults. These are the only attributes allowed.
    function defaults() {
      return { crossDomain: false };
    }

    // Set attributes
    initialize(options);
  }

  _.extend(Auth.prototype, {
    // PUBLIC METHODS
    // Set an attribute or a collection of attributes
    set: function(attrs, newValue) {
      if (_.isString(attrs) && !_.isUndefined(this.defaults()[attrs])) {
        this._setAttribute(attrs, newValue);
      } else {
        this._setAttributes(attrs);
      }
    },

    // Get the value of an attribute
    get: function(attrName) {
      return (this.attributes[attrName]);
    }.bind(this),

    login: function(username, password) {
        // Enable attributes to be used in sucess call
        var attributes = this.attributes;
        var status = false;
        var restEndpoint = Backbone.Drupal.restEndpoint.root + (Backbone.Drupal.restEndpoint.root.charAt(Backbone.Drupal.restEndpoint.root.length - 1) === '/' ? '' : '/');

        jQuery.ajax({
          async: false,
          url :  restEndpoint + 'user/login' + Backbone.Drupal.restEndpoint.dataType,
          type : 'post',
          data : 'username=' + encodeURIComponent(username) + '&password=' + encodeURIComponent(password),
          //dataType : 'json',
          error: function(XMLHttpRequest, textStatus, errorThrown) {
              return false;
            },
          success : function(data) {

              var settings = {
                beforeSend: function (request) {
                  request.setRequestHeader("X-CSRF-Token", data.token);
                }
              };

              if(attributes.crossDomain) {
                settings.xhrFields = {
                  withCredentials: true
                };

                settings.crossDomain = true;
              }

              // Define specific parametres to be used in all future request.
              $.ajaxSetup(settings);

              status=true;
            }
        });

        return status;
      }.bind(this),

    // PRIVATE METHODS

    // Set a single attribute
    _setAttribute: function(key, val) {
      this.attributes[key] = val;
    }.bind(this),

    // Setting a collection of attributes
    _setAttributes: function(attrs) {
      _.each(attrs,
        function(val, key) {
          if (!_.isUndefined(this.defaults[key])) {
            this.attributes[key] = val;
          }
        },
      this);
    }.bind(this),
  });

  return Auth;
})(Backbone, jQuery, _);


Backbone.Drupal.Models = {};


// Base objects for Backbone Drupal implementation.
// ---

// ### Backbone.Drupal.Model
//
// Extend the Model object with default Drupal Services settings and methods.
// These are defaults for interfacing with all Service module's providers.
Backbone.Drupal.Models.Base = Backbone.Model.extend({

  // #### initialize()
  //
  // Set up defaults for attribute processing.
  initialize: function() {
    this.toJSONProcessors = this.JSONProcessors || {};
    this.noSaveAttributes = this.noSaveAttributes || [];
    _(this).bindAll('setNoSaveAttributes', 'getNoSaveAttributes', 'addNoSaveAttributes', 'toJSON');
  },

  // #### toJSON: Enhanced JSON processing function
  // Allows us to specify and override processing functions
  // for a single field. Most of this customization will actuallly
  // be in the backend specific functions, as the preparation is
  // needed to prepare for communication with the server.
  toJSON: function() {
    return _(this.attributes)
      .chain()
      // Filter out any attributes that should not be sent.
      .objReject(function(value, name, list) {
        return (_(this.noSaveAttributes).indexOf(name) >= 0);
      }, this)
      // Transform any attribute values that need processing.
      .objMap(this.toJSONAttribute, this)
      .value();
  },

  // #### setNoSaveAttributes: specify attributes we should not send on save
  // Some backends reject our request when we send attributes we can't change.
  // This function takes a single attribute name or an array of attribute
  // names and will filter those attributes out on save.
  setNoSaveAttributes: function(attributes) {
    this.noSaveAttributes = attributes;
  },

  addNoSaveAttributes: function(attributes) {
    this.noSaveAttributes = _(this.noSaveAttributes).union(attributes);
  },

  getNoSaveAttributes: function(attributes) {
    return this.noSaveAttributes;
  },

  // ### setToJSONProcessor()
  //
  // Use this method to set a custom JSON processor for a given
  // attribute. Currently all overrides are attribute name based,
  // so provide the name of the attribute (e.g. "title") and
  // a function to use (either anonymous func or a method on your
  // model).
  setToJSONProcessor: function(attributeName, processorFunction) {
    this.toJSONProcessors[attributeName] = processorFunction;
  },

  // #### toJSONAttribute: process attribute into JSON if process funciton given.
  toJSONAttribute: function(attributeValue, attributeName) {
    if (typeof this.toJSONProcessors !== 'undefined') {
      if (this.toJSONProcessors[attributeName]) {
        attributeValue = this.toJSONProcessors[attributeName].call(this, attributeValue);
      }
    }
    return attributeValue;
  },

  // Both Services and RESTWS use the format
  // "{endpoint}/{resource-type}/{id}.json, only {endpoint} is empty for
  // RESTWS.
  // We don't include the collection stuff here, since Drupal collections are
  // indpendent of their objects.
  url: function() {
    // Modified from Backbone.js to ignore collection and add ".format" extension.
    var restEndpoint = Backbone.Drupal.restEndpoint.root + (Backbone.Drupal.restEndpoint.root.charAt(Backbone.Drupal.restEndpoint.root.length - 1) === '/' ? '' : '/');
    var base = restEndpoint + this.urlSource;

    if (this.isNew()) { return base; }
    // Add .json for format here.
    return base + (base.charAt(base.length - 1) === '/' ? '' : '/') + encodeURIComponent(this.get(this.idAttribute)) + Backbone.Drupal.restEndpoint.dataType;
  },

  // TODO: evaluate moving all of this to Views.Base
  //       In terms of proper architecture, model should not have views-specific functions.

  // Prepare an object for default rendering
  // arg1: whitelist, array of whitelisted properties (to render)
  // TODO: add blacklist
  renderAttributes: function(whitelist, blacklist) {
    var properties = _.clone(this.attributes);
    if (_.isArray(whitelist)) {
      properties = _(properties).pick(whitelist);
    }
    return properties;
  }

});

Backbone.Drupal.Collections = {};

// ### Backbone.Drupal.Collection
//
// Currently just sets the endpoint for all collections.
//
// TODO fix scoping issue that causes params to bleed between children of this object.
//  e.g. if you have two NodeViewCollections, setting limit on one sets on both.
Backbone.Drupal.Collections.Base = Backbone.Collection.extend({

  // #### initialize()
  //
  // We bind the param functions to this on initialize, to avoid chain
  // inheritance issues.
  //
  // *NOTE* if you subclass this and have an initialize function in your
  // subclass, you need to execute Drupal.Backbone.Collection.initialize
  // explicitly.
  initialize: function(opts) {
    _.bindAll(this, 'setParam', 'setParams', 'getParams');
    this.params = {};
  },

  // #### params
  //
  // Drupal collections are stateful, we store params in the collection.
  params: {},

  // #### setParam(string, string)
  //
  // Setter for individual params, called as setParam('name','value').
  setParam: function(paramName, paramValue) {
    this.params[paramName] = paramValue;
  },

  // #### setParams(object)
  //
  // Setter for multiple params, passed as object with key/value pairs.
  setParams: function(params) {
    if (typeof(this.params) !== 'object') {
      this.params = object;
    }
    if (typeof(params) === 'object') {
      _.extend(
        this.params,
        params
      );
    }
  },

  // #### getParams()
  //
  // Getter. Currently just returns param object property.
  getParams: function() {
    return this.params;
  },

  // #### fetch() implementation
  //
  // Fetch method passes params as data in AJAX call.
  fetch: function(options) {
    options = options ? options : {};
    if (options.data) {
      // Allow options.data to override any params.
      _.defaults(options.data, this.getParams());
    }
    else if (this.getParams()) {
      options.data = this.getParams();
    }
    // Call Super fetch function with options array including any collection params.
    Backbone.Collection.prototype.fetch.call(this, options);
  }
});

