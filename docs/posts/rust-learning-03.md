---
title: Rust 学习笔记 —— 泛型、Trait、代码注释
author: Fei-hui
template: post
keywords: Rust
description: 学习 Rust 的泛型，Trait，代码注释的相关笔记
date: 2024/05/19 11:04
---

### 泛型 & Trait

泛型和 Trait 是 Rust 给函数提供的两个非常强大的特性，但前文 [Rust 学习笔记 —— 函数/闭包，流程语句](./rust-learning-02.md#函数) 中只是讨论了函数的基本用法，这里补充后续学习函数的一些细节，方便更好地理解泛型和 Trait 这两个特性。

#### 函数

Rust 中的函数定义以关键字 `fn` 开始，后跟函数名和参数列表，函数体用大括号 `{}` 包裹。同时，Rust 函数也有一些明确的要求：

1. 函数名与变量名都需要遵循蛇形命名法（ `snack_case` ）的命名规范
2. 函数的参数类型、非无返回值都需要显式标注，无返回值会隐式返回单元类型 `()`，表示函数没有返回值
3. `main` 函数是 Rust 程序开始执行的起点，`main` 函数不接受任何参数也没有返回值
4. 得益于 Rust 是一门编译型语言，编译时会先解析所有的声明和定义，因此 Rust 不关注函数定义的位置，只要有定义即可，编译器底层会处理函数调用与函数定义的联系

```rs
// main 函数是 Rust 程序执行的起点
fn main() {
  println!("Hello World!");
}

// 函数的入参/非无返回值都必须显式标注
// 无返回值会隐式返回零长度的元组，如 fn log() {} 等于 fn log() -> () {}
fn add(x: i32, y: i32) -> i32 {
  // NOTE：
  // 不管是 return 返回还是表达式返回，Rust 的返回句柄都不能有分号

  // 可以通过 return 关键词提前返回
  if x == y {
    return x * 2
  }
  // 表达式
  x + y

}

// 程序遇到阻塞性错误不再继续向下执行，返回 ! 表示函数永不返回
fn dead_end() -> ! {
  panic!("程序崩溃");
}
```

#### 泛型

泛型是具体类型的抽象代替，即编写的代码并不是最终的代码，而是存在着一些“占位符”，Rust 在编译时会根据实际调用的情况，将这些“占位符”替换为具体的类型（ 单态化 ）。

```rs
// 泛型将类型推导的时机延迟到函数调用时
// <T> 的 T 是泛型参数，参数名可以随意起，但一般越短越好
fn add<T>(x: T, y: T) -> T {
  x + y
}

fn main() {
  println!("add(1i8, 2i8) is {}", add(1i8, 2i8));
  println!("add(100, 200) is {}", add(100, 200));
  println!("add(1.5, 2.5) is {}", add(1.5, 2.5));
}
```

#### Trait

Rust 的 Trait（ 特征 ）是定义一组实现某些目标所需要的方法集合（ 类似于 Java 抽象类的概念 ），提前定义实现这些方法所需要的方法声明，实现方法时必须按照定义来实现。这也是 Trait 最常用的业务场景。

```rs
// Rust 通过 trait 关键字声明 trait
pub trait Animal {
  fn make_sound(&self) {
    println!("Default animal sound.")
  }
}

struct Dog;
struct Cat;

// 根据狗的特征重写 make_sound 方法
impl Animal for Dog {
  fn make_sound(&self) {
    println!("Woof!");
  }
}

// 根据猫的特征重写 make_sound 方法
impl Animal for Cat {
  fn make_sound(&self) {
    println!("Meow!");
  }
}

fn main() {
  let dog = Dog;
  let cat = Cat;

  dog.make_sound(); // Woof!
  cat.make_sound(); // Meow!
}
```

在 [Rust 学习笔记 —— 变量/常量，数据类型，枚举/结构体](./rust-learning-01.md#枚举) 这篇文章中提到过，Rust 的自定义类型如果需要输出到控制台时，需要基于 `std::fmt::Display` 或 `std::fmt::Debug` 编写自定义类型的输出规则才能在控制台正确输出，否则会报错。

::: code-group

```rs{10} [std::fmt::Display]
enum MouseEvent {
  Enter,
  Leave,
  Move { x: i32, y: i32 },
  Click { x: i32, y: i32 }, // 结构体类型的传参方式
}

// 基于 std::fmt::Display 实现自定义的输出控制
// 在句柄中可以使用 println!("{}", MouseEvent::xxx) 的枚举项
impl std::fmt::Display for MouseEvent {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
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

  println!("{}", enter_event); // Enter
  println!("{}", leave_event); // Leave

  let move_event = MouseEvent::Move { x: 200, y: 300 };
  let click_event = MouseEvent::Click { x: 100, y: 250 };

  println!("{}", move_event);  // 输出: Move to (200, 300)
  println!("{}", click_event); // 输出: Click at (100, 250)
}
```

```rs{10} [std::fmt::Debug]
enum MouseEvent {
  Enter,
  Leave,
  Move { x: i32, y: i32 },
  Click { x: i32, y: i32 }, // 结构体类型的传参方式
}

// 基于 std::fmt::Debug 实现自定义的输出控制
// 在句柄中可以使用 println!("{:?}", MouseEvent::xxx) 的枚举项
impl std::fmt::Debug for MouseEvent {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
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

:::

在这个场景中，Rust 的 Trait 与 Java 的 `toString` 方法的最终效果相同，只不过 Rust 并没有原生提供自定义类型（ 枚举、结构体 ）的输出规则，而 Java 对类的输出做了预处理，没有 `toString` 方法时会输出 `HelloWorld@MemoryPath` 这种形式。

```java
class HelloWorld {
  public String toString() {
    return "HelloWorld from toString";
  }

  public static void main(String[] args) {
    HelloWorld hw = new HelloWorld();
    System.out.println(hw); // HelloWorld from toString
  }
}
```

### 代码注释

Rust 非常重视代码的规范性，以至于连代码注释也集成了其他编程语言没有的特性。

Rust 不仅在内置的管理工具 `cargo` 中实现了类似于 `swagger` 注释/注解转文档的功能，而且还支持执行文档注释中的测试用例（ 但限于 `lib` 类型的项目，`bin` 类型提供的是二进制文件，无法使用注释功能 ）。

#### 代码注释 & 文档注释

Rust 的代码注释主要分成 2 大类，这 2 大类注释都包括了行注释和块注释两种形式：

1. 代码注释：说明某块代码的功能，面向同个项目的开发者，如同事；行注释为 `//`，块注释为 `/* */`
2. 文档注释：介绍某段代码的功能，面向调用该功能的开发者，但不一定知道该功能的实现逻辑；行注释为 `///`，块注释为 `/** */`

````rs
//  [文档注释 —— 行注释]
/// `get_current_position` 获取当前的定位信息
///
/// ```
/// let (lng, lat) = get_current_position();
/// println!("The lng is {} and lat is {}", lng, lat);
/// ```
fn get_current_position() -> (f64, f64) {
  let lng = 116.40; // 经度 [代码注释 —— 行注释]
  let lat = 39.92;  // 纬度 [代码注释 —— 行注释]

  /* [代码注释 —— 块注释]
   * 经纬度是非常常用的一种地理定位手段，但经纬度的定位误差较大，还需要其他手段来矫正
   */
  (lng, lat)
}

// [文档注释 —— 块注释]
/**
 `get_address_by_position` 根据经纬度获取详细地址，未匹配的地址则会提示未收录

  ```
  let address = get_address_by_position(116.40, 39.92);
  println!("{}", address);
  ```
*/
fn get_address_by_position(lng: f64, lat: f64) -> &'static str {
 if lng == 116.40 && lat == 39.92 {
   "北京市朝阳区故宫博物院"
 } else {
   "未收录的经纬度地址"
 }
}

fn main() {
 let (lng, lat) = get_current_position();
 let address = get_address_by_position(lng, lat);

 // 经纬度：[116.4, 39.92]，地址：北京市朝阳区故宫博物院
 println!("经纬度：[{}, {}]，地址：{}", lng, lat, address);
}
````

执行命令 `cargo doc --open` 就可以看到最终效果：

![Rust 注释文档](/assets/rust-learning-03/rust-comment-doc.png)

#### 文档注释的单元测试

Rust 对文档注释的单元测试做出了一些限制：

1. 使用关键字 `pub` 修饰，否则执行时会报 `error[E0603]: function 'xxx' is private` 的错误
2. 文档注释中的代码块，需要按照 Rust 的包/模块的导入规范，显式用 `use` 导入 Cargo.toml 的 `lib` 字段的包名/模块名

::: code-group

```toml [Cargo.toml]
[lib]
name = "my_library"
path = "src/lib.rs"
```

````rs [src/lib.rs]
/// `get_current_position` 获取当前的定位信息
///
/// ```rust
/// // IMPORTANT!!
/// // 必须使用 use 关键词导入，否则会报错
/// use crate::my_library::get_current_position;
/// let (lng, lat) = get_current_position();
/// println!("The lng is {} and lat is {}", lng, lat);
///
/// assert_eq!(39.92, lat);
/// assert_eq!(116.40, lng);
/// ```
pub fn get_current_position() -> (f64, f64) {
  let lng = 116.40;
  let lat = 39.92;

  (lng, lat)
}
````

:::

在满足上述限制后，便可以通过 `cargo test` 命令运行文档注释中的单元测试。

![Rust 注释中的测试用例执行结果](/assets/rust-learning-03/rust-comment-tests.png)

尽管 Rust 支持这类单元测试，但还是更推荐使用属性标记 `#[test]` 或者 `#[cfg(test)]` 进行单元测试

```rs
/// `get_current_position` 获取当前的定位信息
pub fn get_current_position() -> (f64, f64) {
  let lng = 116.40;
  let lat = 39.92;

  (lng, lat)
}

#[test]
fn it_get_current_position() {
  assert_eq!((116.4, 39.92), get_current_position());
}
```

### 参考资料

- [Rust 语言圣经](https://course.rs/about-book.html)
- [Rust 程序设计语言](https://kaisery.github.io/trpl-zh-cn/title-page.html)
