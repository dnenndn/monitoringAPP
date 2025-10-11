// Avoid deep import of internal ExceptionsManager. Use global ErrorUtils when available.
if (__DEV__) {
  try {
    if (global && typeof global.ErrorUtils === 'object') {
      // set a no-op global error handler in development to replicate previous behavior
      if (typeof global.ErrorUtils.setGlobalHandler === 'function') {
        global.ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
          // no-op
        });
      } else if (typeof global.ErrorUtils.getGlobalHandler === 'function' && typeof global.ErrorUtils.setGlobalHandler === 'function') {
        global.ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
          // no-op
        });
      }
    }
  } catch (e) {
    // ignore if ErrorUtils isn't present in this environment
  }
}

import 'react-native-url-polyfill/auto';
import './src/__create/polyfills';
global.Buffer = require('buffer').Buffer;

import 'expo-router/entry';
import { SplashScreen } from 'expo-router';
import { App } from 'expo-router/build/qualified-entry';
import { type ReactNode, memo, useEffect } from 'react';
import { AppRegistry, LogBox, SafeAreaView, Text, View } from 'react-native';
import { serializeError } from 'serialize-error';
import { DeviceErrorBoundaryWrapper } from './__create/DeviceErrorBoundary';
import { ErrorBoundaryWrapper, SharedErrorBoundary } from './__create/SharedErrorBoundary';

if (__DEV__) {
  LogBox.ignoreAllLogs();
  LogBox.uninstall();
  function WrapperComponentProvider({
    children,
  }: {
    children: ReactNode;
  }) {
    return <DeviceErrorBoundaryWrapper>{children}</DeviceErrorBoundaryWrapper>;
  }

  AppRegistry.setWrapperComponentProvider(() => WrapperComponentProvider);
  AppRegistry.registerComponent('main', () => App);
}
