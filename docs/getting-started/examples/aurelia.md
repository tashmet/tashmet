---
description: Integration with Aurelia
---

# Aurelia

Tashmet offers seamless integration with [Aurelia's](https://aurelia.io/) dependency injection container. This allows services defined in components to be consumed by Aurelia and vice versa.

### Installation

```text
$ npm install @tashmet/ioc-aurelia
```

### Usage

The integration package supplies a function called container that wraps the Aurelia container in a class that implements Tashmet's own container interface. It can then be bootstrapped with a component.

```typescript
import {Aurelia} from 'aurelia-framework';
import {bootstrap} from '@tashmet/tashmet';
import {container} from '@tashmet/ioc-aurelia';

export async function configure(aurelia: Aurelia): Promise<void> {
  aurelia.use.standardConfiguration()

  await bootstrap(Application, {
    container: container(aurelia.container)
  });
  await aurelia.start();
}
```

