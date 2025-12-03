---
title: 利用 hooks 简化函数式组件的状态管理和 ref 引用
author: Fei-hui
template: post
keywords: Typescript, React, 状态管理, ref 引用
description: 利用 React hooks 的封装，简化函数式组件的状态管理和 ref 引用
date: 2022/09/22 14:14
---

::: tip

本文以本人所在的项目的代码如何优化进行讨论，提供一种自己如何优化代码的思路，是否采用以开发者自己所在的项目为准，无需争吵其合理性

:::

我个人在写后台管理系统这一类的 B 端系统时，特别反感在业务代码里写各类弹窗的状态管理、组件 ref 引用的代码；因为这部分逻辑高度重复，但又因为简单导致不好封装这部分的代码。

当某个业务频繁使用到弹窗管理业务数据时，用于管理弹窗显隐的状态代码就很容易与业务代码耦合，独立的状态管理与复杂的业务代码如何进行组织也没有什么比较好的业界规范，很容易出现前面的业务代码需要用到在业务代码后面声明的状态代码这种情况，导致调整状态代码和与之关联的代码顺序。

以实际项目的代码举例：

```tsx {6,7,24,25,51}
import { useState, useCallback } from 'react';
import { Button, Form, Modal, message } from 'antd';

function App() {
  const [form1] = Form.useForm();
  const [modal1, setModal1] = useState(false);
  const [modal1Loading, setModal1Loading] = useState(false);
  const onModal1Submit = useCallback(() => {
    form1.validateFields().then(async formValues => {
      setModal1Loading(true);
      try {
        await submit(formValues); // 模拟数据提交
        setModal1(false);
      } catch {
        message.error('提交失败');
        setModal3(true); // 此处会报错，因为此时弹窗 3 的状态代码并没有声明
      } finally {
        setModal1Loading(false);
      }
    });
  }, [form1]);

  const [form2] = Form.useForm();
  const [modal2, setModal2] = useState(false);
  const [modal2Loading, setModal2Loading] = useState(false);
  const onModal2Submit = useCallback(() => {
    form2.validateFields().then(async formValues => {
      setModal2Loading(true);
      try {
        await submit(formValues); // 模拟数据提交
        setModal2(false);
      } catch {
        message.error('提交失败');
      } finally {
        setModal2Loading(false);
      }
    });
  }, [form2]);
  const onModal2Cancel = useCallback(() => {
    modal.confirm({
      title: '确认',
      content: '是否确认取消该操作',
      okText: '确认取消',
      cancelText: '再考虑考虑',
      onOk: () => {
        setModal2(false);
      },
    });
  }, []);

  const [modal3, setModal3] = useState(false);

  return (
    <div>
      <Modal
        open={modal1}
        confirmLoading={modal1Loading}
        onOk={onModal1Submit}
        onCancel={() => setModal1(false)}
      >
        <p>弹窗1在提交数据成功后才能关闭弹窗</p>
      </Modal>
      <Modal
        open={modal2}
        confirmLoading={modal2Loading}
        onOk={onModal2Submit}
        onCancel={onModal2Cancel}
      >
        <p>
          弹窗2在提交数据成功后才能关闭弹窗，取消时需询问用户是否要取消，确定后才能管理
        </p>
      </Modal>
      <Modal open={modal3} onCancel={() => setModal3(false)}>
        <p>弹窗3是个用户帮助，内部展示用户需如何操作的帮助手册</p>
      </Modal>
      <Button onClick={() => setModal1(true)}>打开弹窗 1</Button>
      <Button onClick={() => setModal2(true)}>打开弹窗 2</Button>
    </div>
  );
}
```

对于 `Modal` 组件，我个人觉得组件的 `open` / `confirmLoading` 应该是其内部的状态，在大部分的业务场景下，由内部提供对外暴露的方法进行状态管理会比外部控制更为简练，侵入面更小。

对比明显的是 `Form` 组件，组件内部处理了各类复杂的状态、表单验证的逻辑，外部通过 `useForm` 与业务数据进行关联，在业务侧侵入面小。

根据上面的问题，我对代码做了一部分调整：

1. 所有状态代码在函数组件最顶部声明
2. 封装 `Modal` 组件 `open` / `confirmLoading` 的这两个状态到 `Modal.useModalState`

::: code-group

```tsx [App.tsx]
import { useState, useCallback } from 'react';
import { Button, Form, message } from 'antd';

// 引入组件
import Modal from './Modal';

function App() {
  // 表单状态
  const [form1] = Form.useForm();
  const [form2] = Form.useForm();
  const [form3] = Form.useForm();

  // 弹窗状态
  const [modal1] = Modal.useModalState();
  const [modal2] = Modal.useModalState();
  const [modal3] = Modal.useModalState();

  const onModal1Submit = useCallback(() => {
    form1.validateFields().then(async formValues => {
      modal1.confirming();
      try {
        await submit(formValues); // 模拟数据提交
        modal1.hide();
      } catch {
        message.error('提交失败');
        modal3.show(); // 此时正常调用
      } finally {
        modal1.confirmed();
      }
    });
  }, [form1]);
  const onModal2Submit = useCallback(() => {
    form2.validateFields().then(async formValues => {
      modal2.confirming();
      try {
        await submit(formValues);
        modal2.hide();
      } catch {
        message.error('提交失败');
      } finally {
        modal2.confirmed();
      }
    });
  }, [form2]);
  const onModal2Cancel = useCallback(() => {
    modal.confirm({
      title: '确认',
      content: '是否确认取消该操作',
      okText: '确认取消',
      cancelText: '再考虑考虑',
      onOk: modal2.hide,
    });
  }, []);

  return (
    <div>
      <Modal
        modalState={modal1}
        onOk={onModal1Submit}
        onCancel={() => setModal1(false)}
      >
        <p>弹窗1在提交数据成功后才能关闭弹窗</p>
      </Modal>
      <Modal
        modalState={modal2}
        onOk={onModal2Submit}
        onCancel={onModal2Cancel}
      >
        <p>
          弹窗2在提交数据成功后才能关闭弹窗，取消时需询问用户是否要取消，确定后才能管理
        </p>
      </Modal>
      <Modal modalState={modal3} onCancel={modal3.hide}>
        <p>弹窗3是个用户帮助，内部展示用户需如何操作的帮助手册</p>
      </Modal>
      <Button onClick={modal1.show}>打开弹窗 1</Button>
      <Button onClick={modal2.show}>打开弹窗 2</Button>
    </div>
  );
}
```

```tsx [Modal.tsx]
import { useState } from 'react';
import { Modal as AntModal, ModalProps as AntModalProps } from 'antd';

/**
 * 弹窗状态管理
 */
interface ModalState {
  /** 是否显示弹窗 */
  visible: boolean;
  /** 提交状态 */
  confirm: boolean;
  /** 显示弹窗 */
  show: () => void;
  /** 隐藏弹窗 */
  hide: () => void;
  /** 提交完成 */
  confirmed: () => void;
  /** 提交中 */
  confirming: () => void;
}

interface ModalProps extends AntModalProps {
  /**
   * 弹窗状态管理
   */
  modalState: ModalState;
}

function Modal(props: ModalProps) {
  const { open, confirmLoading, modalState, children, ...restProps } = props;

  return (
    <AntModal
      {...restProps}
      open={open || modalState.visible}
      confirmLoading={confirmLoading || modalState.confirm}
    >
      {children}
    </AntModal>
  );
}

Modal.useModalState = () => {
  const [confirm, setConfirm] = useState(false);
  const [visible, setVisible] = useState(false);
  return [
    {
      visible,
      confirm,
      show: () => setVisible(true),
      hide: () => setVisible(false),
      confirmed: () => setConfirm(false),
      confirming: () => setConfirm(true),
    },
  ] as [ModalState];
};

export default Modal;
```

:::

关于第二点调整，还有一种比较好的用法：封装 `useRef` 创建对 DOM 的引用，通过 hooks 的形式调用 DOM / 组件中通过 `forwardRef` / `useImperativeHandle` 暴露的方法，也更符合 React 对于函数式组件的定义。

::: code-group

```tsx{6,9} [App.tsx]
import { useMount } from 'ahooks';

import Input from './Input';

function App() {
  const input = Input.useInput();

  useMount(() => {
    input.focus();
  });

  return <Input input={input} />;
}
```

```tsx{23,33} [Input.tsx]
import { useCallback, useEffect, useRef } from 'react';
import { Input as AntInput, InputProps as AntInputProps, InputRef } from 'antd';

/** 组件上下文 */
interface InputContext {
  /** 绑定组件引用 */
  bind: (input: InputRef) => void;
  /** 组件聚焦 */
  focus: () => void;
}

interface InputProps extends AntInputProps {
  /** Input 组件上下文 */
  input: InputContext;
}

function Input(props: InputProps) {
  const inputRef = useRef<InputRef>(null);
  const { input, ...restProps } = props;

  useEffect(() => {
    // 绑定 Input 组件引用到 useInput 中
    inputRef.current && input.bind(inputRef.current);
  }, [input]);

  return <AntInput {...restProps} ref={inputRef} />;
}

Input.useInput = () => {
  const inputRef = useRef<InputRef>();

  const bind = useCallback((input: InputRef) => {
    inputRef.current = input;
  }, []);

  const focus = useCallback(() => {
    // 组件聚焦
    inputRef.current && inputRef.current.focus && inputRef.current.focus();
  }, []);

  return { bind, focus };
};

export default Input;
```

:::
