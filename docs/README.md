---
description: An introduction to the Ziqquratu publishing platform
---

# Introduction

## Description

Ziqquratu is a lightweight open-source database written in typescript with the purpose of publishing content in a web application such as a blog or a larger web site. The framework is isomorphic, meaning it can run both on the server and the client.

Setting up an application is easy, so let's get started!

{% page-ref page="getting-started/application.md" %}

## Philosophy

The framework was created mainly to make it easy to share content between a server and a client. It was built using a highly modular design with scalability in mind which means you could use it for a simple web-page, blog or larger web application.

When running it in a web-browser you probably want to have the content rendered using some front-end framework. Ziqquratu does not limit your choices here.

## Components

#### [Core](ziqquratu/core/)

Underlying library dealing with inversion of control \(dependency injection\) and reflection \(meta data and decorators\).

#### [Database](ziqquratu/database/)

The database including collections for storing in memory and via http.

#### [View](ziqquratu/views/) <a id="view"></a>

Stored queries and views monitoring subsets of documents i a collection.

#### [Nabu](nabu.md)

A set of tools for reading and writing content on disk. It allows us to store collections in files with support for common formats like JSON, YAML or Markdown.

#### [Tashmetu](tashmetu.md)

An HTTP server for publishing content. It allows us to define RESTful resources that interact with the collections in our database.



