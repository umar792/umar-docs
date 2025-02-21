# Variables in JavaScript
In javascript variables are used to store any type of data. Variables have any names like **Skill**, **Name**, **Age**, etc.

## Naming Convention 
We can use any name in variables like,  **X**, **Name**, **Age**,  etc. Or you can use any other name.

**Note:**
You cannot start any variables name with special character eg. **$name** , **@skill**


## Types of variables
There are three different types of variables in JavaScript which are 
```js
let , var , const
```

## Examples
```js
var hello = "Hello world";

let name = "My name";

const my_skill = "JavaScript"

```

## Difference between  ---  let , var , const

### var: 
In **var** variable you can redeclare and reassign value in same variable name.

### let:
In **let** variable you can reassign value to same variable but you cannot redeclare a variable with same name.

### const:
In **const**  variable you cannot redeclare and reassign a variable with same name.


## Examples

```js

// var
var a = 10;
a = 20;  // reassign value a variable
var a = 30; // redeclare a variable

// let
let b = 2;
b = 10; // reassign value to variable
// in var cannot redeclare a variable with same name


// const
const c = 20;
// in const cannot redeclare and reassign variable with same name

```