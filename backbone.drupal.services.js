// backbone.drupal 0.1.0
//
// (c) 2014 enzo - Eduardo Garcia enzo@enzolutions
// Licensed under the MIT license.

// ## Backbone Drupal Models

// ### Backbone.Drupal.Node
//
// Model for nodes.
Backbone.Drupal.Models.Node = Backbone.Drupal.Models.Base.extend({
  urlSource: "node",
  idAttribute: "nid",

  initialize: function(opts) {
    Backbone.Drupal.Models.Base.prototype.initialize.call(this, opts);
    // Set up common boolean fields for correct JSON format for services
    this.setToJSONProcessor('promote', this.toJSONBoolean);
  },

  toJSON: function() {
    return {
      node: Backbone.Drupal.Models.Base.prototype.toJSON.call(this)
    };
  },

  // Processor for Boolean values, needed due to way Services treats "false".
  // See http://drupal.org/node/1511662 and http://drupal.org/node/1561292
  toJSONBoolean: function(value) {
    if (value === 1 || value === "1" || value === true || value === "true") {
      return true;
    } else {
      return null;
    }
  }

});

// ### Backbone.Drupal.User
//
// Model for users.
//
// * TODO: Add support for login and logout methods.
Backbone.Drupal.Models.User = Backbone.Drupal.Models.Base.extend({
  urlSource: "user",
  idAttribute: "uid"
});

// ### Backbone.Drupal.Comment
//
// Model for comments.
Backbone.Drupal.Models.Comment = Backbone.Drupal.Models.Base.extend({
  urlSource: "comment",
  idAttribute: "cid",

  // Override toJSON function to nest all attributes in a { comment: ... } key
  // to make this work with the Services module implementation of comment PUSH/PUT.
  toJSON: function() {
    var data = {
      comment: Backbone.Drupal.Models.Base.prototype.toJSON.call(this)
    };
    return data;
  }
});

// ### Backbone.Drupal.File
//
// Model for files.
Backbone.Drupal.Models.File = Backbone.Drupal.Models.Base.extend({
  urlSource: "file",
  idAttribute: "fid",

  // Override toJSON function to nest all attributes in a { file: ... } key
  // to make this work with the Services module implementation of file PUSH/PUT.
  toJSON: function() {
    var data = {
      file: Backbone.Drupal.Models.Base.prototype.toJSON.call(this)
    };
    return data;
  }
});


// ## Backbone Drupal Collections
//
// Specific collections for Drupal listing types.

// ### Backbone.Drupal.NodeIndexCollection
//
// Create collection for Node resource's index interface.
Backbone.Drupal.Collections.NodeIndex = Backbone.Drupal.Collections.Base.extend({
  model: Backbone.Drupal.Models.Node,
  url: function() {
      var restEndpoint = Backbone.Drupal.restEndpoint.root + (Backbone.Drupal.restEndpoint.root.charAt(Backbone.Drupal.restEndpoint.root.length - 1) === '/' ? '' : '/');
      return restEndpoint + "node" . Backbone.Drupal.restEndpoint.dataType;
  }
});

// ### Backbone.Drupal.NodeViewCollection
//
// Create collection for Views resource's index interface.
// Note that this is just for views that use the "Content" display
// for their nodes.  Field views will need to be handled differently.
//
// May be worth considering if field views are really appropriate
// for backbone, since it deals with collections of model objects,
// and field views do not fit that mode.
//
// * TODO allow view name at initialization or fetch.
// * TODO create basic view collection, subclass node and field views.
Backbone.Drupal.Collections.NodeView = Backbone.Drupal.Collections.Base.extend({
  initialize: function(opts) {
  opts = opts || {};
    this.constructor.__super__.initialize.call(this, opts);
    // TODO: debug why this is needed, model should be automatically passed.
    this.model = opts.model ? opts.model : Backbone.Drupal.Models.Node;
    this.viewName = opts.viewName;
  },
  url: function() {
      var restEndpoint = Backbone.Drupal.restEndpoint.root + (Backbone.Drupal.restEndpoint.root.charAt(Backbone.Drupal.restEndpoint.root.length - 1) === '/' ? '' : '/');

      return restEndpoint + "views/" + this.viewName  + Backbone.Drupal.restEndpoint.dataType + (typeof(this.filters) !== "undefined"? this.filters: '');
  },
  setFilters: function (filters) {
    if(filters !== '') {
      this.filters = filters;
    }
  }
});

// ### Backbone.Drupal.UserIndexCollection
//
// Create collection for User resource's index interface.
Backbone.Drupal.Collections.UserIndex = Backbone.Drupal.Collections.Base.extend({
  model: Backbone.Drupal.Models.User,
  url: function() {
      var restEndpoint = Backbone.Drupal.restEndpoint.root + (Backbone.Drupal.restEndpoint.root.charAt(Backbone.Drupal.restEndpoint.root.length - 1) === '/' ? '' : '/');
      return restEndpoint + "user" + Backbone.Drupal.restEndpoint.dataType;
  }
});

Backbone.Drupal.Views = {};

// ## Backbone Drupal Views
//
// ### Backbone.Drupal.Views.Base
//
// The parent class for most rendered Drupal Backbone views, this object
// mainly contains functions for standardizing and abstracting calls to
// the template library and references to templates.  It meant to be
// easily extended, so you can focus on logic and presentation of content
// types, view data etc., and minimize boilerplate code.  At the same time
// the template engine specifics have been abstracted out, so that
// switching to a differen template library (such as Handlebars.js),
// should be as easy as overriding the compileTemplate and/or
// executeTemplate functions, with everything else remaining the same.
//
//    * TODO add parentEl property, and automatically attach the new el
//      if it exists as part of this.render()
Backbone.Drupal.Views.Base = Backbone.View.extend({

  // #### initialize
  //
  // Initialize our view by preparing the template for later rendering.
  //
  // This can work in either of two ways:
  //
  //    1. by passing Backbone.Drupal.View.create() an options object with
  //       a jQuery object or selector pointing to the template or the actual
  //       source of the template to be loaded.
  //    2. by subclassing this object and setting either the
  //       templateSelector or templateSource propoerties. Note that you
  //       need to be sure to call this initialize function in your
  //       subclass if you override the initialize function there. Example
  //       code would look like:
  //
  //           myDrupalBackboneView = Backbone.Drupal.View.extend({
  //             templateSelector: '#template-id'
  //           });
  initialize: function(opts) {
    _.bindAll(this,
              'getTemplate',
              'compileTemplate',
              'getTemplateSource',
              'loadTemplate',
              'setTemplateSource',
              'getTemplate',
              'executeTemplate',
              'render',
              'unrender'
             );


    // Set up default renders provided by the module:
    //   * Underscore.template()
    //   * Twig
    //   * Handlebars
    this.renderers = {
      underscore:{
        compile: function(source) {
          return _.template(source);
        },
        execute: function(template, vars) {
          return template(vars);
        }
      },
      twig: {
        compile: function(source) {
          return twig({
            data: source
          });
        },
        execute: function(template, vars) {
          return template.render(vars);
        }
      },
      handlebars: {
        compile: function(source) {
          return handlebars.template(source);
        },
        execute: function(template, vars) {
          return template.execute(vars);
        }
      }
    };

    if (typeof(opts) !== 'object') {
      opts = {};
    }

    if (typeof opts.renderer === "string") {
      this.renderer = this.renderers[opts.renderer];
    } else if (typeof opts.renderer === "object") {
      this.renderer = opts.renderer;
    } else {
      this.renderer = this.renderers.underscore;
    }
    this.setTemplateSource(opts.templateSource || this.templateSource);
    this.templateSelector = opts.templateSelector || this.templateSelector;
    if (this.getTemplateSource()) {
      this.compileTemplate();
    }

  },

  // #### compileTemplate()
  //
  // Compile our template code as a template object.
  //
  // This is using _.template(), but so long as template objects have an
  // execute function all we should need to do is override this method to
  // implement new template libraries.
  compileTemplate: function(source) {
    this.template = this.renderer.compile(source || this.getTemplateSource());
  },

  // #### executeTemplate()
  //
  // Wrapper around tempating library's render function. By default this
  // is executing the template object itself, the _.template standard,
  // this should also work for Handlebars. For other systems this may need
  // to be overridden.
  executeTemplate: function(variables) {
    return this.renderer.execute(this.template, variables);
  },

  // #### getTemplateSource()
  //
  // Returns the source for the template.  If the templateSource property
  // is not set, it will check the templateSeclector and try to load the
  // template from code.
  getTemplateSource: function() {
    if (!this.templateSource && this.templateSelector) {
      this.loadTemplate(this.templateSelector);
    }
    return this.templateSource;
  },

  // #### loadTemplate()
  //
  // Load template from jQuery object or selector. If no selector is
  // passed, uses the templateSelector property of the view.
  loadTemplate: function(selector) {
    selector = selector || this.templateSelector;
    if (typeof(selector) === 'object') {
      this.setTemplateSource(selector.html());
    }
    else if (typeof(selector) === 'string') {
      this.setTemplateSource($(selector).html());
    }
  },

  // #### setTemplateSource()
  //
  // Setter for the template source property.
  setTemplateSource: function(source) {
    this.templateSource = source;
  },


  // #### getTemplate()
  //
  // Function to encapsulate the logic for getting the template, and
  // loading as needed from selector or source.
  getTemplate: function() {
    if (!this.templateSource && this.templateObj) {
      this.setTemplateSource(this.templateObj.html());
    }
    else if (this.templateSource) {
      return this.compileTemplate(this.templateSource);
    }
  },

  // #### render(variables, el)
  //
  // Default render function, passes arg variables or model attributes object to
  // template, renders using executeTemplate() method and then appends to
  // this.el or other specified el.
  // TODO: refactor model rendering into separate view class
  render: function(variables, el){
    variables = (typeof variables === "object") ? variables : {};
    el = (typeof el === "undefined") ? this.el : el;
    if (this.model && (variables !=={})) {
      variables = this.model.renderAttributes();
    }

    var content = this.executeTemplate(variables);
    $(this.el).html(content);

    // return ```this``` so calls can be chained.
    return this;
  },

  // #### unrender()
  //
  // Default unrender method, removes this.el from DOM.
  unrender: function() {
    $(this.el).remove();
    return this;
  }
}); // end extend

// Extension of View to handle collections
// Can specify a view for each collection item, a container el as well as location for insert
// Q: should the container el for each item be on the individual view, or here? I think here, to enable re-use of model views which may not be in li, etc.
Backbone.Drupal.Views.CollectionView = Backbone.Drupal.Views.Base.extend({

  // Intiialize function takes a configuration object as argument.
  // Expected properties must include:
  //
  // ```
  // {
  //   collection: collectionObject,
  //   itemView: ItemViewClass,
  //   itemParent: Selector for target attach point of rendered items, defaults to appending to this.el  //($obj or selector string)
  // }
  // ```
  //
  // This view owes a lot to the following resources:
  //   * "[Recipes with Backbone.js](http://recipeswithbackbone.com/)" by Gauthier and Strom
  //   * "[Binding a Collection to a View](http://liquidmedia.ca/blog/2011/02/backbone-js-part-3/)", n_time
  //   * "[Rendering Backbone collections in a view](http://rickquantz.com/2012/02/rendering-backbone-collections-in-a-view/)", Rick Quantz
  initialize: function(opts) {
    // call parent initialize w/ opts
    Backbone.Drupal.Views.Base.prototype.initialize.call(this, opts);
    // Bind methods needing binding
    _.bindAll(this, 'render', 'addAll', 'addOne', 'remove');
    this.ItemView = opts.ItemView;
    this.itemParent = opts.itemParent;
    // Keep an array pointing to all item views (aka "child views").
    this._itemViews = [];
    // Bind to important collection events.
    this.collection.bind('add', this.addOne);
    this.collection.bind('reset', this.addAll);
    this.collection.bind('remove', this.remove);
    this.addAll();
  },

  // Add a single item to the view.
  // Render individually and attach, if the collection view has already rendered.
  // TODO: set up "insert at" rendering, so new models don't have to go at the end.
  // TODO: fix issue of extended renderer property being overridden/discounted by initialize.
  addOne: function(newModel) {
    var myItemView = new this.ItemView({
      model: newModel,
      renderer: this.options.renderer // this is a cheat, assume same renderer for children (specifying renderer via extend isn't working)
    });

    // Store pointer to this view in a private variable.
    this._itemViews.push(myItemView);

    // TODO: refactor using model view class
    // TODO: fix binding issue so we can just call render and have it use its own model
    //       (currently "this" in ItemView.render is pointing to the collection view)
    myItemView.render(newModel.renderAttributes());
    this.$(this.itemParent).append(myItemView.el);

    // Bind collection remove to model view remove.
    newModel.bind('remove', myItemView.unrender);
  },

  // Add all, for bootstrapping, etc.
  addAll: function() {
    this.collection.each(this.addOne);
  },

  // Special render method
  render: function(vars) {
    // Call parent render function, pass any vars, to render container
    Backbone.Drupal.Views.Base.prototype.render.call(this, vars);
    return this;
  },

  // Remove one item, if needed.
  // NOTE: this does not remove the element from the DOM, just the internal array.
  // The individual item view should remove itself.
  remove: function(model) {
    var viewToRemove = _(this._itemViews).select(function(itemView) {
      return itemView.model === model;
    })[0];
    this._itemViews = _(this._itemViews).without(viewToRemove);
  }
});



// Set Backbone.TypeName to Base Objects for Legacy Compatability.
// NOTE: These object references are deprecated and could go away!
Backbone.Drupal.View = Backbone.Drupal.Views.Base;
Backbone.Drupal.Model = Backbone.Drupal.Models.Base;
Backbone.Drupal.Collection = Backbone.Drupal.Collections.Base;

// Set up some Utility functions
_.mixin({
  // ### _.objMap
  //
  // _.map for objects, keeps key/value associations
  // and changes the value via function.
  // Adapted from https://github.com/documentcloud/underscore/issues/220
  objMap: function (input, mapper, context) {
    return _.reduce(input, function (obj, v, k) {
      obj[k] = mapper.call(context, v, k, input);
      return obj;
    }, {}, context);
  },
  // ### _.objFilter
  //
  // _.filter for objects, keeps key/value associations
  // but only includes the properties that pass test().
  // Adapted from https://github.com/documentcloud/underscore/issues/220
  objFilter: function (input, test, context) {
    return _.reduce(input, function (obj, v, k) {
      if (test.call(context, v, k, input)) {
        obj[k] = v;
      }
      return obj;
    }, {}, context);
  },
  // ### _.objReject
  //
  // _.reject for objects, keeps key/value associations
  // but only includes the properties that pass test().
  // Adapted from https://github.com/documentcloud/underscore/issues/220
  objReject: function (input, test, context) {
    return _.reduce(input, function (obj, v, k) {
      if (!test.call(context, v, k, input)) {
        obj[k] = v;
      }
      return obj;
    }, {}, context);
  }
});

