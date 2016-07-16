var expect = require('chai').expect;
var sinon  = require('sinon');

describe('tashmetu.validator', function() {
  var factory = {
    schema: function() {}
  };
  var validator = require('../../lib/services/validator.js')(factory);

  describe('checkPost', function() {
    var schemaStub = sinon.stub(factory, 'schema');
    var schema = {
      "id": "post",
      "type": "object",
      "properties": {
        "title":{ "type": "string" }
      },
      "required": ["title"]
    };

    it('should fail if post is not an object', function() {
      expect(validator.checkPost(3)).to.deep.equal({
        success: false,
        schema: null,
        errors: ['Could not validate non-object']
      });
    });

    it('should use "post" schema by default', function() {
      var post = {};
      expect(validator.checkPost(post)).to.deep.equal({
        success: false,
        schema: null,
        errors: ['Could not find schema: post']
      });
    });

    it('should use custom schema if type property is set on post', function() {
      var post = { type: 'custom' };
      expect(validator.checkPost(post)).to.deep.equal({
        success: false,
        schema: null,
        errors: ['Could not find schema: custom']
      });
    });

    it('should fail if missing required properties', function() {
      var post = {};
      schemaStub.withArgs('post').returns(schema);

      expect(validator.checkPost(post)).to.deep.equal({
        success: false,
        schema: schema,
        errors: ['requires property "title"']
      });
    });

    it('should pass if post conforms to schema', function() {
      var post = { title: 'Test Post' };
      expect(validator.checkPost(post)).to.deep.equal({
        success: true,
        schema: schema,
        errors: []
      });
    });
  });
});

