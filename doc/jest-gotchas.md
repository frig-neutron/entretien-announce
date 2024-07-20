# Jest Gotchas

Sometimes Jest gets you

## Mocking

Mocking only seems to work if the real code hasn't been loaded yet. This places restrictions on the
use of `import` statements to import the system under test, since the imports execute first.

### Problem 

Let's say you want to mock `GASPubsubPublisher`, which is a class defined in this codebase. The 
class is imported from SUT and instantiated inside it. Just running 

```typescript
jest.mock("path/to/class/module")
```

from within the test code does not replace the class constructor, even if you 

```typescript
jest.doMock("path/to/class/module", () => {
    return {
      GASPubsubPublisher: jest.fn().mockImplementation(() => {
        // mock impl
      })
    }
  });
```

b/c the class has already been loaded into the SUT module. The mocking is too late, and when you 

```typescript
expect(GASPubsubPublisher.publish).toHaveBeenCalledTimes(1)
```

you get an error b/c `expect(..)` doesn't have a Jest mock but a regular impl class.

### Solution
ℹ There is a fault in this reasoning. See [reflection](#reflection). 

Religiously rely on the `import` FUNCTION - as opposed to the `import` STATEMENT

Importing and calling SUT:
```typescript
  // test setup
  const SUT = await import("path/to/sut/module") // import the SUT in the test

  // test execution
  SUT["method_under_test"]()  // call SUT methods
```

#### WRONG TURN in the mock code:
Mocking SUT dependency also has to avoid using the `import` statement. Instead, use the `import` function:

```typescript
  // test setup
  jest.mock("path/to/class/module") // mock the class
  const mockedClassModule = await import("path/to/class/module")

  // mock verification
  expect(mockedClassModule.to_comment).toHaveBeenCalledTimes(1)
```

This turned out to be wrong b/c it only gave me access to the `GASPubsubPublisher` class, but 
not to the instance `publish` method. Actual solution turned out to be: 

```typescript
import {GASPubsubPublisher} from "../../appscript/pubsub_publisher";

  // Mock setup
  const mockGASPubsubPublisher: GASPubsubPublisher = {
    publish: jest.fn()
  };

  jest.mock("../../appscript/pubsub_publisher", () => {
    return {
      GASPubsubPublisher: jest.fn().mockImplementation(() => {
        return mockGASPubsubPublisher
      })
    }
  })

  // mock verification:
  expect(mockGASPubsubPublisher.publish).toHaveBeenCalledTimes(1)
```

#### Reflection 

I don't know why this works - clearly my initial assumption about the load order is wrong b/c I 
see the real class loading before the mocking code executes. 

In the test code 
- importing the SUT using an `import` statement has no effect whether the mocking works, BUT
- executing the SUT using the imported symbol uses the real `GASPubsubPublisher` class
- executing the SUT using the dynamic `import(..)`ed symbol uses the mock
