---
title: Rust 学习笔记 —— 函数/闭包，流程语句
author: Fei-hui
template: post
keywords: Rust, 函数, 闭包, 流程语句
description: 学习 Rust 函数/闭包，流程语句的相关笔记
date: 2024/03/16 14:14
---

接前文 [Rust 学习笔记 —— 变量/常量，数据类型，枚举/结构体](./rust-learning-01.md) 的基础上，继续了解和学习 Rust 关于函数/闭包、流程语句相关的知识。

### 函数/闭包

#### 函数

函数是现代编程语言中的基本构建块之一，用于封装可重用的代码块，并实现特定的功能。在 Rust 中，函数具有非常严格的类型系统和内存安全性的要求，能够帮助构建稳定安全的函数代码，同时也是非常难以掌握的一部分内容。

```rs
fn main() {
  let sum = two_sum(1, 1);

  say_hello_world();                    // Hello, world!
  println!("two_sum(1, 1) is {}", sum); // two_sum(1, 1) is 2
}

// Rust 是编译型语言，编译器能够通过引用找到函数的逻辑
// 因此 Rust 不关心函数在何处定义，只要有函数的定义即可
fn say_hello_world() {
  println!("Hello, world!");
}

// Rust 规定，必须显式声明每个参数的类型以及非空返回值的类型
// 否则在编译阶段会报对应的错误提示
fn two_sum(x: i32, y: i32) -> i32 {
  // Rust 的函数返回值有 2 种方式：
  // 1. 使用 return 关键字提前返回，需要添加分号
  if x == y {
    return x * 2;
  }
  // 2. 代码块末尾返回，不用添加 return 关键字和句尾分号
  x + y
}
```

::: warning 面向对象编程

面向对象编程是现代编程语言常用的一种编程范式，封装/多态/继承都是非常常用的编程手段，但 Rust 并不是一门面向对象的编程语言，尽管这些功能可以通过其他方式实现。

```rs
// 结构体，对应面向对象编程语言的抽象类的概念
// 结构体内部声明需要用到的属性，方法则需要结构体的代码块实现中编写
struct Point {
  x: f64,
  y: f64,
}

// 对应同名结构体的代码块实现
impl Point {
  // 传统的面向对象编程语言一般会使用 `new` 关键字创建新的实例，在 Rust 中并没有创建类实例的功能
  // 大部分情况下是基于面向对象的编码规范，在结构体的代码块实现里声明一个名为 `new` 的静态方法
  fn new(x: f64, y: f64) -> Point {
    Point { x, y }
  }

  // `create` 与 `new` 静态方法没有本质区别，都是结构体的静态方法
  fn create(x: f64, y: f64) -> Point {
    Point { x, y }
  }

  // Rust 区别静态方法和实例方法的判断：
  // 看结构体方法的第一个参数是否为结构体的引用，即 `&Self`
  // `area` 便是一个实例方法，`&self` 是 `self: &Self` 的语法糖，其中 `Self` 是方法调用者的类型，在这里便是 `Self` = `Point`
  fn area(&self) -> f64 {
    (self.x * self.y).abs()
  }

  // 如果需要修改结构体上属性的值，可以通过 `&mut self` 实现，`&mut self` 为 `self: &mut Self` 的语法糖
  fn resize(&mut self, x: f64, y: f64) {
    self.x = x;
    self.y = y;
  }
}

fn main() {
  // 通过 `create` 方法构造实例与通过 `new` 方法没有本质区别，两者的效果是一致的
  let new_point = Point::create(1.0, 1.0);
  let mut mut_point = Point::new(1.0, 1.0);

  // 因为 `resize` 方法需要修改结构体上的属性值，需要使用 `mut` 关键词允许修改变量 `mut_point`
  mut_point.resize(2.0, 2.0);

  println!("new_point.area = {}", new_point.area()); // new_point.area = 1
  println!("mut_point.area = {}", mut_point.area()); // mut_point.area = 4
}
```

:::

#### 闭包

Rust 为了更好地管理内存，不允许从其他的函数作用域引用变量值，这种限制导致实现函数柯里化这一类的逻辑变得不好实现，因此增加了闭包的相关语法。

```rs
fn main() {
  let x = 0;

  // NOTE:
  // 在函数内部声明的函数，无法直接访问上层函数的变量，编译时会直接报错
  // error[E0434]: can't capture dynamic environment in a fn item
  fn add_y(y: i32) {
    // help: use the `|| { ... }` closure form instead
    x + y
  }

  println!("add_y(2) is {}", add_y(2));
}
```

Rust 的闭包（ lambda 表达式 ），是一类能够捕获周围作用域中变量的函数。在 Rust 中调用一个闭包和调用一个函数完全相同，不过调用闭包时，输入和返回类型两者都可以自动推导，而输入变量名必须指明。

```rs
fn main() {
  let x = 0;
  // NOTE：
  // 捕获周围作用域中的 x 变量的闭包语法，声明时使用 `||` 而不是 `()` 将入参包起来
  // 函数体的定界符 `{}` 在单条语句里可以忽略，`add_y` 的代码可以替换为下面任意一种书写形式
  // 1. `let add_y = |y: i32| x + y;`
  // 2. `let add_y = |y: i32| -> i32 { x + y };`
  let add_y = |y: i32| { x + y };

  // 调用闭包与调用函数是完全一样的
  println!("add_y(2) is {}", add_y(2));
}
```

### 流程控制

任何编程语言必有的部分就是通过流程语句改变控制流程，Rust 也是一样。

#### if/else 判断语句

Rust 的判断条件为布尔类型，判断不需要使用小括号包裹；如果有返回值，所有分支的返回值都必须返回相同的类型。

```rs
use std::io;

fn main() {
  println!("Guess the number of 0 ~ 10");
  println!("Please input your guess");

  // 等待终端输入数字
  let mut guess = String::new();
  io::stdin()
    .read_line(&mut guess)
    .expect("Fail to read line");

  // 数据类型转换
  let guess_int: i32 = guess.trim().parse().expect("Want a number");
  let except_int = 5;

  // 通过 if/else if/else 语句判断，走不同的判断句柄逻辑
  if guess_int < except_int {
    println!("Small");
  } else if guess_int == except_int {
    println!("Bingo!");
  } else {
    println!("Big");
  }
}
```

#### match 模式匹配

Rust 中并没有提供 `switch` 循环语句，而是通过 `match` 关键词提供了模式匹配，这样使得所有可能的值都必须覆盖到。

```rs
enum IPType {
  IPV4,
  IPV6
}

fn main() {
  let ip_type = IPType::IPV4;

  // match 句柄允许返回一个值
  let ip_addr = match ip_type {
    // 可能的值
    IPType::IPV4 => "127.0.0.1",
    // 默认处理句柄
    _ => "::1",
  }

  println!("{}", ip_addr);
}
```

#### for 循环语句

Rust 的 `for` 循环语句形式一般是 `for .. in ..`，与其他编程语言不同的一点，Rust 的 `for` 循环语句只能遍历具有 Iterator 特征的值，如数组、向量，没有 Iterator 特征的值无法遍历。

```rs
fn main() {
  let array = [1, 2, 3, 4, 5];

  // NOTE：
  // Rust 的数组类型本身是有 iterator 特征的内置类型，所以可以直接遍历
  // 但是功能受限，只能取到对应的值，但无法获取到如下标这一类重要的信息
  // for value in array {
  //   println!("{}", value);
  // }

  // 因此在开发中比较常用的书写方式是通过 iter 方法创建迭代器
  // 再使用迭代器上的 enumerate 方法取出下标
  for (index, value) in array.iter().enumerate() {
    println!("array[{}] = {}", index, value);
  }
}
```

#### while 循环语句

Rust 的 `while` 循环又称为当型循环，只在条件满足时才会执行循环。

```rs
fn main() {
  let mut counter = 0;

  // 条件满足时才继续循环
  while counter < 10 {
    if counter % 2 == 0 {
      println!("{} is even", counter);
    } else {
      println!("{} is odd", counter);
    }
    counter += 1;
  }
}
```

#### loop 循环语句

Rust 提供了 `loop` 关键字来创建一个简单的无限循环，并通过 `break` 和 `continue` 关键字来终止循环和进入下一循环。

```rs
fn main() {
  let mut counter = 0;

  // loop 是一个表达式，可以通过 break 关键字携带返回值，此时等同于 return
  let result = loop {
    counter += 1;

    if counter == 10 {
      break counter * 2;
    }
  }

  // The result is 20
  println!("The result is {}", result);
}
```

### 参考资料

- [Rust 语言圣经](https://course.rs/about-book.html)
- [Rust 程序设计语言](https://kaisery.github.io/trpl-zh-cn/title-page.html)
