---
title: Rust 学习笔记 —— 变量/常量，数据类型，枚举/结构体
author: Fei-hui
template: post
keywords: Rust, 变量, 常量, 原生类型, 标量类型, 复合类型, 集合类型，枚举，结构体
description: 学习 Rust 变量/常量，数据类型，枚举/结构体的相关笔记
date: 2024/03/09 14:14
---

Rust 是一门注重安全、速度和并发的现代系统编程语言，大量借鉴了 C / C++ / Python 等编程语言，并建立了一套特有的编程概念，使其能够在无垃圾回收机制的基础上仍能够实现内存管理的运行机制。

```rs
// Rust 的入口函数
// 当调用编译生成的可执行文件时，main 函数里的语句将被运行
fn main() {
  // 将文本打印到控制台
  // println! 是一个宏 macros，可以将文本输出到控制台
  println!("Hello World!");
}
```

### 变量/常量

变量和常量是大多数的编程语言都会出现的概念，Rust 也不例外，但是也有比较特别的地方。

#### 变量

Rust 是一门静态类型的编程语言，但是其内置了非常强大的类型推导系统，大多数情况下可以通过上下文直接推导出变量的类型。

```rs
fn main() {
  let x = 1;  // 等同于 let x: i32 = 1;

  let y;      // 变量已声明但未绑定到变量
  y = 2;      // 编译器会根据 y = 2 的变量绑定逻辑推导出 y 的类型为 i32

  let _z = 3; // 编译器会对未使用的变量绑定产生警告，可以给变量名加上下划线前缀来消除警告

  println!("x = {}", x); // x = 1
  println!("y = {}", y); // y = 2
}
```

Rust 与其他编程语言明显不同的一点，Rust 的变量在默认情况下是不可变的，在不可变的情况下变更变量值的时候会编译报错；如果需要修改变量，则需要在绑定变量时使用 `mut` 修饰符修饰。

```rs
fn main() {
  let mut x = 0;

  // 使用 mut 关键词可以正常地修改变量的值
  x = 1;

  let y = 2;

  // Rust 编译时报错，提示 cannot assign twice to immutable variable `y`
  // 没有 mut 关键词修饰时，变量 y 的值无法被修改
  // y = 3;

  println!("x = {}", x); // x = 1
  println!("y = {}", y); // y = 2
}
```

Rust 规定变量必须声明在 `{}` 之间的代码块内，变量在绑定之后都有其可生效的作用域，在作用域消失之后，对应作用域上的变量也会被销毁，从而实现垃圾回收，涉及到Rust 独有的所有权、生命周期两部分内容。

```rs
// Rust 不允许在变量声明在代码块之外，否则会报 error: expected item, found keyword `let` 的编译错误
// let x = 0;

fn void_fn() {
  // 变量 x 在函数 void_fn 的作用域内绑定了一个值，因此变量 x 在函数 void_fn 的作用域内有效
  let x = 1;

  // `{}` 可以创建一个代码块，在新的代码块里可以创建新的作用域，内部作用域可以使用外部作用域的变量
  {
    // 创建一个新的代码块作用域，在该代码块作用域绑定的变量持续到作业域消失前都有效
    let x = 3;
    println!("main.block.x = {}", x);  // main.block.x = 3
    // 代码块的作用域消失，代码块作用域内绑定的变量值都会被销毁
  }

  // 变量遮蔽：Rust 允许声明同名变量，声明新的同名变量之后，旧的同名变量将会被销毁
  let x = x + 1;
  println!("main.x = {}", x);         // main.x = 2

  // 函数 void_fn 执行完成，作用域消失，在函数 void_fn 的作用域内绑定的变量值都会被销毁，如变量 x
}

// 函数有返回值的时候，不同类型的返回值处理会有不同
fn sum() -> i32 {
  let x = 1;
  let y = 2;

  // 当函数有返回值时，则会按照返回值的类型执行 2 种策略：
  // 1. 当返回值是实现了 `Copy` 特征的值时（如：原生类型），Rust 会直接复制一份值并将复制值的所有权传递给调用者，而函数内部的变量仍然会被销毁
  // 2. 当返回值是未实现 `Copy` 特征的值时，Rust 会将返回值移动到调用者的作用域中，而函数内部的变量仍然会被销毁（需要防止出现垂悬引用的情况，即返回值调用了销毁函数作用域中的变量）
  x + y
}

fn main() {
  // sum 函数的返回值的所有权传递给了调用者变量 num
  let num = sum();

  void_fn();
  println!("sum = {}", num);
}
```

#### 常量

Rust 的常量是在声明之后不允许被修改，且在声明时必须显式声明常量值的类型。与变量不同的是，常量可以声明在任意的作用域范围内，包括全局作用域，也因此常量没有变量的所有权概念。

```rs
// 常量可以声明在全局作用域，但必须显式声明常量值的类型
const LANGUAGE: &'static str = "Rust";

fn main() {
  println!("LANGUAGE = {}", LANGUAGE);
}
```

### 数据类型

Rust 提供了 2 类原生类型：标量类型、复合类型

1. 标量类型：单一类型的数据，有整数、浮点数、布尔值、字符
2. 复合类型：多种类型组成的数据结构，有数组、元组

#### 标量类型

标量类型指单一类型的数据结构，在 Rust 中有 5 个基本的标量类型：

1. 整型：即整数，分为有符号整数 ( i8 / i16 / i32 / i64 / i128 / isize ) 和无符号整数 ( u8 / u16 / u32 / u64 / u128 / usize ) 两种
2. 浮点型：即浮点数，分为 32 位单精度浮点数 ( f32 ) 及 64 位双精度浮点数 ( f64 ) 两种
3. 布尔型：即布尔值，只能是 true / false
4. 字符：单个 Unicode 字符，需要用单引号声明，每个字符占用 4 字节
5. 单元类型：即空元组 `()` ，尽管单元类型的值是个元组，但仍不认为是个复合类型，因为不包含多个值，为函数的默认返回值

```rs
fn main() {
  // NOTE：
  // Rust 推荐使用 snake_case 蛇形命令法声明变量/函数，使用 camelCase 驼峰命名法会编译报错

  let a_float: f64 = 1.0;  // 常规类型说明
  let an_integer   = 5i32; // 后缀类型说明

  // 如果没有声明，Rust 会进行类型推断，按默认方式决定类型
  let default_float   = 3.0; // `f64`
  let default_integer = 7;   // `i32`

  // 也可根据上下文自动推断，会根据下一行的赋值推断为 `i64` 类型
  let mut infer_type = 12;
  infer_type = 42_9496_7296i64; // Rust 还支持 _ 数字分割符，方便开发者阅读

  // 布尔型
  let boolean = true;

  // 单元类型，值只有一个空元组
  let unit_type = ();

  // 字符型，支持单个 `Unicode` 字符，支持各国文字及 emoji 表情
  let unicode_char = 'a';

  println!("a_float is {}", a_float);                   // a_float is 1.0
  println!("an_integer is {}", an_integer);             // an_integer is 5
  println!("default_float is {}", default_float);       // default_float is 3.0
  println!("default_integer is {}", default_integer);   // default_integer is 7
  println!("infer_type is {}", infer_type);             // infer_type is 4294967296
  println!("boolean is {}", boolean);                   // boolean is true
  println!("unit_type is {:?}", unit_type);             // unit_type is ()
  println!("unicode_char is {}", unicode_char);         // unicode_char is a
}
```

#### 复合类型

复合类型是指多个值组合成一个类型，在 Rust 中有 2 个复合类型：

1. 元组：元组允许不同的类型合成一个元组
2. 数组：数组是一组拥有相同类型的值的集合

```rs
fn main() {
  // ==================================  数组  ==================================

  // 数组只能存放数量明确，类型相同的值
  let array = [1, 2, 3, 4, 5];          // => let array: [i32, 5] = [1, 2, 3, 4, 5];

  // 在控制台打印数组时，无法使用 `{}` 打印，需要使用 `{:?}` 打印
  println!("array is {:?}", array);            // array is [1, 2, 3, 4, 5]
  // 通过数组的下标来访问具体的值
  println!("array[0] is {}", array[0]);        // array[0] is 1
  // 访问数组的长度
  println!("array size is {}", array.len());   // array size is 5
  // 访问数组的一部分，即数组切片
  println!("array slice is {}", &array[1..3]); // array slice is [2, 3]

  // ==================================  元组  ==================================

  // 元组可以存放类型不同的值
  let tuple = (1, 1.2, true, 'a', ()); // => let tuple: (i32, f64, bool, char, ()) = (1, 1.2, true, 'a', ());

  // 在控制台打印元组时，无法使用 `{}` 打印，需要使用 `{:?}` 打印
  // 但是当元组长度超过 12 时，也无法通过 `{:?}` 打印元组，需要自行进行兼容
  println!("tuple is {:?}", tuple);   // tuple is (1, 1.2, true, 'a', ())
  // 通过元组的下标来访问具体的值
  println!("tuple.0 is {}", tuple.0); // tuple.0 is 1
}
```

与其他编程语言不太一样的是，元组、数组在声明后类型、长度都不能再修改。

从上面可以看出 Rust 原生类型的特性：原生类型在声明时就已经确定其占用内存空间的大小，而不需要担心动态增减带来的内存空间的变化；也因为原生类型不可变，Rust 将原生类型存放到栈上，使其有更快的访问速度，拥有更好的性能表现。

### 集合类型

前文提到 Rust 原生类型在定义之后不可变，而集合类型则可以在程序运行时根据实际需要动态增减。在 Rust 中有 3 种集合类型：

1. 字符串：多个字符组成的数据结构
2. 向量：多个相同类型的值组成的数据结构
3. 哈希表：多个键值对组成的数据结构

```rs
fn main() {
  // ================================== 字符串 ==================================

  // 声明字符串的变量
  let str_basic = String::from("Hello World!");

  // 当使用双引号可以直接声明，Rust 会创建一个字符串切片，可以使用一部分字符串的方法
  // 需要注意的是，字符串切片在声明之后是一个不可变的引用，因此无法通过添加 mut 修饰符进行编辑
  let str_split = "Hello World!";

  // 声明可变的字符串变量
  let mut str_mut = String::new();

  // 对字符串变量进行增减
  str_mut.push_str("Hello World!");

  println!("str_mut's value is {}", str_mut.trim());     // str_mut's value is Hello World!
  println!("str_basic's value is {}", str_basic.trim()); // str_basic's value is Hello World!
  println!("str_split's value is {}", str_split.trim()); // str_split's value is Hello World!

  // ==================================  向量  ==================================

  // 声明整型类型的向量
  let vec_basic = Vec::from([1]);

  // Rust 内置了创建向量的语法糖，可以通过 vec! 这个宏直接创建向量
  let vec_sugar = vec![1, 2];

  // 创建可变的向量变量
  let mut vec_mut = Vec::new(); // 也可以使用 let mut vec_mut = vec![]; 这种形式

  // 往向量中添加数据
  vec_mut.push(1);
  vec_mut.push(2);
  vec_mut.push(3);

  println!("vec_basic's value is {:?}", vec_basic); // vec_basic's value is [1]
  println!("vec_sugar's value is {:?}", vec_sugar); // vec_sugar's value is [1, 2]
  println!("vec_mut's value is {:?}", vec_mut);     // vec_mut's value is [1, 2, 3]

  // ================================== 哈希表 ==================================

  // 声明哈希表的可变变量
  // 哈希表当前并不会像向量那样被 Rust 预导入，需要手动引入
  // 也可以在 rs 顶部用 std::collections::HashMap 导入，便可以直接使用 HashMap::new() 声明哈希表
  let mut hash_map = std::collections::HashMap::new();

  // 往哈希表中添加数据
  hash_map.insert(1, 1);
  hash_map.insert(2, 2);
  hash_map.insert(3, 3);

  println!("hash_map's value is {:?}", hash_map); // hash_map's value is { 1: 1, 2: 2, 3: 3 }
}
```

由于集合类型的灵活性，Rust 将集合类型的数据存储在堆上，因为堆提供了灵活性和动态存储能力，但堆的访问速度对比栈更慢。

### 自定义类型

::: tip
在《Rust 语言圣经》这本书里，将枚举、结构体都归到了集合类型里。本文按照《Rust 程序设计语言》的分类划分为自定义类型。
:::

自定义类型指开发者可以根据业务的需要自行定义的数据类型，在 Rust 中提供了 2 种自定义类型：

1. 枚举
2. 结构体

#### 枚举

在 Rust 中通过 `enum` 关键字定义枚举类型，枚举内可以根据开发者的需要使用不同的类型的值。

```rs
#[derive(Debug)]
enum IPAddressKind {
  IPV4, // 默认使用枚举的键值，等同于 IPV4 = String::from("IPV4")
  IPV6,
}

#[derive(Debug)]
enum IPAddress {
  IPV4(u8, u8, u8, u8), // 也可以支持元组类型/结构体类型的传参方式，此处为元组类型的传参方式
  IPV6(String),
}

enum Color {
  Red = 0xff0000, // Rust 的枚举也支持 C 语言的显式赋值
  Blue = 0x0000ff,
  Green = 0x00ff00,
}

fn main() {
  let ipv4 = IPAddressKind::IPV4;
  let ipv6 = IPAddressKind::IPV6;

  println!("IPAddressKind is {:?}", ipv4); // IPAddressKind is IPV4
  println!("IPAddressKind is {:?}", ipv6); // IPAddressKind is IPV6

  // ======================================================================================

  let ipv4_addr = IPAddress::IPV4(127, 0, 0, 1);
  let ipv6_addr = IPAddress::IPV6(String::from("::1"));

  println!("IPAddress::IPV4 is {:?}", ipv4_addr); // IPAddress::IPV4 is IPV4(127, 0, 0, 1)
  println!("IPAddress::IPV6 is {:?}", ipv6_addr); // IPAddress::IPV6 is IPV6("::1")

  // ======================================================================================

  let red_color = Color::Red;
  let blue_color = Color::Blue;
  let green_color = Color::Green;

  fn what_is_color(color: Color) {
    match color {
      Color::Red => println!("The color is red"),
      Color::Blue => println!("The color is blue"),
      Color::Green => println!("The color is green"),
    }
  }

  what_is_color(red_color);   // The color is red
  what_is_color(blue_color);  // The color is blue
  what_is_color(green_color); // The color is green
}
```

Rust 为了高效率的执行并没有对自定义类型做特征处理，因此在控制台格式化输出打印枚举类型时，需要在枚举定义的前面添加 `#[derive(Debug)]` 语句，该语句可以自动为枚举实现 `Debug` 特质；除此之外，也可以自行基于 `std::fmt::Display` 或 `std::fmt::Debug` 特征实现相关的格式化输出逻辑。

```rs
use std::fmt;

// #[derive(Debug)]
enum MouseEvent {
  Enter,
  Leave,
  Move { x: i32, y: i32 },
  Click { x: i32, y: i32 }, // 结构体类型的传参方式
}

// 在 Rust 打印非原生类型的值到控制台，可能需要基于 `std::fmt::Display` 或 `std::fmt::Debug` 实现输出
// 此处基于 `std::fmt::Debug` 实现自定义的输出控制，在句柄中可以使用 `println!("{:?}", MouseEvent::xxx)` 的枚举项
// 更简单更直接的方法是通过在 MouseEvent 枚举定义之前添加 #[derive(Debug)] ，自动为 MouseEvent 枚举实现 Debug 特质
impl fmt::Debug for MouseEvent {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    // self 即 MouseEvent
    match self {
      MouseEvent::Leave => write!(f, "Leave"),
      MouseEvent::Enter => write!(f, "Enter"),
      MouseEvent::Move { x, y } => write!(f, "Move to ({}, {})", x, y),
      MouseEvent::Click { x, y } => write!(f, "Click at ({}, {})", x, y),
    }
  }
}

fn main() {
  let enter_event = MouseEvent::Enter;
  let leave_event = MouseEvent::Leave;

  println!("{:?}", enter_event); // Enter
  println!("{:?}", leave_event); // Leave

  let move_event = MouseEvent::Move { x: 200, y: 300 };
  let click_event = MouseEvent::Click { x: 100, y: 250 };

  println!("{:?}", move_event);  // 输出: Move to (200, 300)
  println!("{:?}", click_event); // 输出: Click at (100, 250)
}
```

#### 结构体

在 Rust 中通过 `struct` 关键字定义结构体类型，结构体与枚举相同，结构体内可以根据开发者的需要使用不同的类型的值。

```rs
// 最常见的 C 语言风格结构体声明方式，可以在结构体内声明各种不同的类型的值，概念/用处都与 Java 中的抽象类相似
struct Student {
  id: i32,
  name: String,
}

// 除了最常见的 C 语言风格的声明方式之外，还有 2 种声明方式
// 1. 单元结构体：`struct Unit`，不带任何字段的声明，在泛型中很有用
// 2. 元组结构体：`struct Point(x: f64, y: f64)`，本质上是具名元组

fn main() {
  // 创建结构体
  let zhang_san = Student {
    id: 1,
    name: String::from("张三"),
  };

  // 可以使用 let 来进行结构体的解构或者对变量的重命名
  let Student {
    name: zhang_san_name, ..
  } = zhang_san;

  println!("zhang_san.id = {}", zhang_san.id);     // zhang_san.id = 1
  println!("zhang_san.name = {}", zhang_san_name); // zhang_san.name = 张三
}
```

结构体是 Rust 的非常重要的一种类型，是 Rust 面向对象编程的基础。

```rs
/// 学生结构体
struct Student {
  id: i32,
  name: String,
}

impl Student {
  /// 创建 Student 类实例
  pub fn new(id: i32, name: String) -> Student {
    Student { id, name }
  }

  /// 获取学生学号
  pub fn id(&self) -> i32 {
    self.id
  }

  /// 获取学生姓名
  pub fn name(&self) -> String {
    self.name.to_string()
  }
}

fn main() {
  // 创建 Student 类的实例
  let zs = Student::new(1, String::from("ZhangSan"));
  let ls = Student::new(2, String::from("LiSi"));

  println!("The {}'s id = {}", zs.name(), zs.id()); // The ZhangSan's id = 1
  println!("The {}'s id = {}", ls.name(), ls.id()); // The LiSi's id = 2
}
```

### 参考资料

- [Rust 语言圣经](https://course.rs/about-book.html)
- [Rust 程序设计语言](https://kaisery.github.io/trpl-zh-cn/title-page.html)
