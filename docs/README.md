---
title: Introduction
description: Tashmet documentation
---

# Tashmet

## What is this?

Tashmet is a javascript database that provides an interface that as closely
as possible tracks the interface of MongoDB. Basically Tashmet leverages the
power of the excellent aggregation framework [mingo](https://github.com/kofrasa/mingo)
together with concepts like databases and collections to provide a MongoDB-like
experience in pure javascript.

## Why?

The primary motivation for this framework, and what really makes it powerful,
is the ability to work with documents on your filesystem, be they json, yaml
or other formats. Since custom operators are supported, an aggregation
pipeline can also involve steps for doing things like transforming markdown to
html or writing output to the file system. These features alone makes Tashmet
an excellent backbone in a project such as a static site generator.

## Basic concepts

Just like MongoDB, Tashmet is built on a client/server architecture but with
the additional option to short-loop that gap with a connection to a storage
engine in the same process.

The connection medium between client and server (or storage engine) is referred
to as the proxy.

