/// <reference types="es4x.d.ts" />

// this is a shameless C&P rewrite of the vertx graphql example + calling some gRPC in the middle...

import {Router} from "@vertx/web";
import {GraphiQLHandler, GraphQLHandler} from "@vertx/web-graphql";

// the first interop with Java starts here, as there's no knowledge on the JVM classes
// we need to manually import them, this is a area that shall be improved in ES4X to
// allow modules to declare known classes to avoid this syntax but use import statements

const GraphQL = Java.type('graphql.GraphQL');
const RuntimeWiring = Java.type('graphql.schema.idl.RuntimeWiring');
const SchemaGenerator = Java.type('graphql.schema.idl.SchemaGenerator');
const SchemaParser = Java.type('graphql.schema.idl.SchemaParser');

// this should not be like this, we should annotate this class to be used from the module above

const VertxDataFetcher = Java.type('io.vertx.ext.web.handler.graphql.VertxDataFetcher');

// now do the same for gRPC as there's no gRPC npm module yet for ES4X

const GreeterGrpc = Java.type('io.grpc.examples.helloworld.GreeterGrpc');
const HelloRequest = Java.type('io.grpc.examples.helloworld.HelloRequest');
const VertxChannelBuilder = Java.type('io.vertx.grpc.VertxChannelBuilder');

// start of the code...

// the GraphQL defines 2 classes, so I've put them inline here...

/**
 * Defines a user
 */
class User {
  /**
   * Create a User.
   * @param {String} name
   */
  constructor(name) {
    this.name = name;
  }

  /**
   * returns the user name.
   * @returns {String}
   */
  getName() {
    return this.name;
  }
}

class Link {
  /**
   * Create a Link.
   * @param {String} url
   * @param {String} description
   * @param {User} postedBy
   */
  constructor(url, description, postedBy) {
    this.url = url;
    this.description = description;
    this.postedBy = postedBy;
  }

  /**
   * Get the link url.
   * @returns {String}
   */
  getUrl() {
    return this.url;
  }

  /**
   * Get the link description.
   * @returns {String}
   */
  getDescription() {
    return this.description;
  }

  /**
   * Get the link author.
   * @returns {User}
   */
  getPostedBy() {
    return this.postedBy;
  }
}

// dummy data
const links = [];

// this function prepares the dummy data for graphQL as per the demo...

function prepareData() {
  let peter = new User("Peter");
  let paul = new User("Paul");
  let jack = new User("Jack");

  links.push(new Link("https://vertx.io", "Vert.x project", peter));
  links.push(new Link("https://www.eclipse.org", "Eclipse Foundation", paul));
  links.push(new Link("http://reactivex.io", "ReactiveX libraries", jack));
  links.push(new Link("https://www.graphql-java.com", "GraphQL Java implementation", peter));
}

function createGraphQL() {

  let channel = VertxChannelBuilder
    .forAddress(vertx, "localhost", 50051)
    .usePlaintext(true)
    .build();

  let stub = GreeterGrpc.newVertxStub(channel);

  let schema = vertx.fileSystem().readFileBlocking("links.graphqls").toString();

  let schemaParser = new SchemaParser();
  let typeDefinitionRegistry = schemaParser.parse(schema);

  let runtimeWiring = RuntimeWiring.newRuntimeWiring()
    .type("Query", builder => {
      let getAllLinks = new VertxDataFetcher((env, future) => {
        let secureOnly = env.getArgument("secureOnly");
        let result = links
          .filter(link => !secureOnly || link.getUrl().startsWith("https://"));

        future.complete(result);
      });
      return builder.dataFetcher("allLinks", getAllLinks);
    })
    // let's add another query that this time does a gRPC call
    .type("Query", builder => {
      let getgRPCHelloWorld = new VertxDataFetcher((env, future) => {
        let request = HelloRequest.newBuilder().setName("Paulo").build();
        // this show the async model of the 2 libraries together...
        stub.sayHello(request, asyncResponse => {
          if (asyncResponse.succeeded()) {
            future.complete(asyncResponse.result().getMessage());
          } else {
            future.fail(asyncResponse.cause());
          }
        });
      });
      return builder.dataFetcher("helloworld", getgRPCHelloWorld);
    })
    .build();

  let schemaGenerator = new SchemaGenerator();
  let graphQLSchema = schemaGenerator.makeExecutableSchema(typeDefinitionRegistry, runtimeWiring);

  return GraphQL.newGraphQL(graphQLSchema)
    .build();
}

// init the graphql application

prepareData();

const app = Router.router(vertx);

app
  .route("/graphql")
    .handler(GraphQLHandler.create(createGraphQL()));

app
  .route("/graphiql/*")
    .handler(GraphiQLHandler.create());

vertx
  .createHttpServer()
  .requestHandler(app)
  .listen(8080);
