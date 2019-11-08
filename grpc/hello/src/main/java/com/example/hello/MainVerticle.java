package com.example.hello;

import io.grpc.examples.helloworld.GreeterGrpc;
import io.grpc.examples.helloworld.HelloReply;
import io.grpc.examples.helloworld.HelloRequest;
import io.vertx.core.AbstractVerticle;
import io.vertx.core.Future;
import io.vertx.core.Vertx;
import io.vertx.grpc.VertxServer;
import io.vertx.grpc.VertxServerBuilder;

public class MainVerticle extends AbstractVerticle {

  @Override
  public void start() {
    VertxServer server = VertxServerBuilder
      .forAddress(vertx, "127.0.0.1", 50051)
      .addService(new GreeterGrpc.GreeterVertxImplBase() {
        @Override
        public void sayHello(HelloRequest req, Future<HelloReply> fut) {
          System.out.println("Hello " + req.getName());
          fut.complete(
            HelloReply.newBuilder()
              .setMessage("Hi there, " + req.getName())
              .build());
        }
      }).build();

    server.start(ar -> {
      if (ar.succeeded()) {
        System.out.println("gRPC service started");
      } else {
        ar.cause().printStackTrace();
        System.exit(1);
      }
    });
  }

  public static void main(String[] args) {
    Vertx.vertx().deployVerticle(new MainVerticle());
  }
}
