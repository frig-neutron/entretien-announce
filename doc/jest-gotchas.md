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

Religiously rely on the `import` FUNCTION - as opposed to the `import` STATEMENT

Importing and calling SUT:
```typescript
  // test setup
  const SUT = await import("path/to/sut/module") // import the SUT in the test

  // test execution
  SUT["method_under_test"]()  // call SUT methods
```

Mocking SUT dependency also has to avoid using the `import` statement. Instead, use the `import` function:

```typescript
  // test setup
  jest.mock("path/to/class/module") // mock the class
  const mockedClassModule = await import("path/to/class/module")

  // mock verification
  expect(mockedClassModule.GASPubsubPublisher).toHaveBeenCalledTimes(1)
```
