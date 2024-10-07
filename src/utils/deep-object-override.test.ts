import { describe, expect, it } from 'vitest';
import deepObjectOverride from './deep-object-override';

describe('deepObjectOverride', () => {
  it('should return the original object if no overrides are provided', () => {
    const original = {
      string: 'string',
      number: 1,
      boolean: true,
      object: {
        keyOne: 'value',
        keyTwo: 2,
        keyThree: ['one', 'two', 'three'],
      },
      deeplyNested: {
        keyOne: {
          keyTwo: {
            keyThree: {
              keyFour: 'value',
            },
          },
        },
      },
      array: [1, 2, 3],
    };
    const result = deepObjectOverride(original);
    expect(result).toBe(original); // It should be the same object reference
  });

  it('should override simple properties', () => {
    const original = {
      string: 'string',
      number: 1,
      boolean: true,
      object: {
        keyOne: 'value',
        keyTwo: 2,
        keyThree: ['one', 'two', 'three'],
      },
      deeplyNested: {
        keyOne: {
          keyTwo: {
            keyThree: {
              keyFour: 'value',
            },
          },
        },
      },
      array: [1, 2, 3],
    };
    const overrides = {
      string: 'new string',
      number: 2,
      boolean: false,
    };
    const expected = {
      string: 'new string',
      number: 2,
      boolean: false,
      object: {
        keyOne: 'value',
        keyTwo: 2,
        keyThree: ['one', 'two', 'three'],
      },
      deeplyNested: {
        keyOne: {
          keyTwo: {
            keyThree: {
              keyFour: 'value',
            },
          },
        },
      },
      array: [1, 2, 3],
    };
    const result = deepObjectOverride(original, overrides);
    expect(result).toEqual(expected);
  });

  it('should deeply override nested objects', () => {
    const original = {
      string: 'string',
      number: 1,
      boolean: true,
      object: {
        keyOne: 'value',
        keyTwo: 2,
        keyThree: ['one', 'two', 'three'],
      },
      deeplyNested: {
        keyOne: {
          keyTwo: {
            keyThree: {
              keyFour: 'value',
            },
          },
        },
      },
      array: [1, 2, 3],
    };
    const overrides = {
      object: {
        keyOne: 'new value',
        keyTwo: 3,
        keyThree: ['four', 'five'],
      },
    };
    const expected = {
      string: 'string',
      number: 1,
      boolean: true,
      object: {
        keyOne: 'new value',
        keyTwo: 3,
        keyThree: ['four', 'five'],
      },
      deeplyNested: {
        keyOne: {
          keyTwo: {
            keyThree: {
              keyFour: 'value',
            },
          },
        },
      },
      array: [1, 2, 3],
    };
    const result = deepObjectOverride(original, overrides);
    expect(result).toEqual(expected);
  });

  it('should handle arrays within objects', () => {
    const original = {
      string: 'string',
      number: 1,
      boolean: true,
      object: {
        keyOne: 'value',
        keyTwo: 2,
        keyThree: ['one', 'two', 'three'],
      },
      deeplyNested: {
        keyOne: {
          keyTwo: {
            keyThree: {
              keyFour: 'value',
            },
          },
        },
      },
      array: [1, 2, 3],
    };
    const overrides = {
      object: {
        keyThree: ['four', 'five'],
      },
    };
    const expected = {
      string: 'string',
      number: 1,
      boolean: true,
      object: {
        keyOne: 'value',
        keyTwo: 2,
        keyThree: ['four', 'five'],
      },
      deeplyNested: {
        keyOne: {
          keyTwo: {
            keyThree: {
              keyFour: 'value',
            },
          },
        },
      },
      array: [1, 2, 3],
    };
    const result = deepObjectOverride(original, overrides);
    expect(result).toEqual(expected);
  });

  it('should handle deeply nested arrays and objects', () => {
    const original = {
      string: 'string',
      number: 1,
      boolean: true,
      object: {
        keyOne: 'value',
        keyTwo: 2,
        keyThree: ['one', 'two', 'three'],
      },
      deeplyNested: {
        keyOne: {
          keyTwo: {
            keyThree: {
              keyFour: 'value',
            },
          },
        },
      },
      array: [1, 2, 3],
    };
    const overrides = {
      deeplyNested: {
        keyOne: {
          keyTwo: {
            keyThree: {
              keyFour: 'new value',
            },
          },
        },
      },
    };
    const expected = {
      string: 'string',
      number: 1,
      boolean: true,
      object: {
        keyOne: 'value',
        keyTwo: 2,
        keyThree: ['one', 'two', 'three'],
      },
      deeplyNested: {
        keyOne: {
          keyTwo: {
            keyThree: {
              keyFour: 'new value',
            },
          },
        },
      },
      array: [1, 2, 3],
    };
    const result = deepObjectOverride(original, overrides);
    expect(result).toEqual(expected);
  });

  it('should replace the original value with an empty object if the override value is an empty object', () => {
    const original = {
      string: 'string',
      number: 1,
      boolean: true,
      object: {
        keyOne: 'value',
        keyTwo: 2,
        keyThree: ['one', 'two', 'three'],
      },
      deeplyNested: {
        keyOne: {
          keyTwo: {
            keyThree: {
              keyFour: 'value',
            },
          },
        },
      },
      array: [1, 2, 3],
    };
    const overrides = {
      object: {},
      deeplyNested: {
        keyOne: {
          keyTwo: {
            keyThree: {},
          },
        },
      },
    };
    const expected = {
      string: 'string',
      number: 1,
      boolean: true,
      object: {},
      deeplyNested: {
        keyOne: {
          keyTwo: {
            keyThree: {},
          },
        },
      },
      array: [1, 2, 3],
    };
    const result = deepObjectOverride(original, overrides);
    expect(result).toEqual(expected);
  });

  it('should replace the original value with an empty array if the override value is an empty array', () => {
    const original = {
      string: 'string',
      number: 1,
      boolean: true,
      object: {
        keyOne: 'value',
        keyTwo: 2,
        keyThree: ['one', 'two', 'three'],
      },
      deeplyNested: {
        keyOne: {
          keyTwo: {
            keyThree: {
              keyFour: 'value',
            },
          },
        },
      },
      array: [1, 2, 3],
    };
    const overrides = {
      object: {
        keyThree: [],
      },
      array: [],
    };
    const expected = {
      string: 'string',
      number: 1,
      boolean: true,
      object: {
        keyOne: 'value',
        keyTwo: 2,
        keyThree: [],
      },
      deeplyNested: {
        keyOne: {
          keyTwo: {
            keyThree: {
              keyFour: 'value',
            },
          },
        },
      },
      array: [],
    };
    const result = deepObjectOverride(original, overrides);
    expect(result).toEqual(expected);
  });
});
