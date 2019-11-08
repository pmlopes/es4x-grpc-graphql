# GraphQL and gRPC with ES4X DEMO

This is a quick demo mixing graphql and grpc with es4x. In order to keep things simple, there are 2 projects.

1. The JS project that you're currently looking at
2. A Java gRPC server under [grpc/hello](grpc/hello)

Mixing Java and JS in ES4X is easy, for this project to work, first build the server part:

```shell script
cd grpc/hello
./mvnw clean package
```

This will produce a `jar` that contains the proto buffers compiled classes. Now we can build the JS project

```shell script
yarn install
```

You will notice that the npm packages will be downloaded, plus maven packages will be downloaded too, there will be
even more packages downloaded that are not npm related. See the entry `mvnDependencies` in [package.json](package.json).

Also notice that the post install calls `es4x` with `-v` which stands for `vendor libs`. This extra jars will be added
to the classpath of the es4x application.

As this is a quick a dirty demo, start the java server with:

```shell script
cd grpc/hello
./mvnw exec:java -Dexec.mainClass="com.example.hello.MainVerticle" 
```

This is just a helper server to showcase the interop between services...

Lets get back to JavaScript:

```shell script
yarn start
```

You should see that the verticle was deployed successfuly, how open a browser to: [http://localhost:8080/graphiql/](http://localhost:8080/graphiql/)

You can now run 2 queries:

```graphql
{
  allLinks {
    url
    description
  }
}
```

Which will run the JS defined graphql code...

And the second query:

```graphql
{helloworld}
```

Which goes over GraphQL to gRPC over the wire to the java server and return back to the browser.
