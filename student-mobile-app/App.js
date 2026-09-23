import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, BackHandler, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRef, useEffect, useState } from 'react';

export default function App() {
  const webviewRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);

  // Student Portal URL (Use your machine's local IP address instead of localhost, or a production URL)
  // Example: 'http://192.168.1.100:3002'
  const portalUrl = 'http://10.0.2.2:3002'; // Default Android Emulator to local host

  useEffect(() => {
    const backAction = () => {
      if (canGoBack && webviewRef.current) {
        webviewRef.current.goBack();
        return true;
      }
      return false; // Let default back button behavior happen (exit app)
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [canGoBack]);

  const onNavigationStateChange = (navState) => {
    setCanGoBack(navState.canGoBack);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#111827" />
      <View style={styles.webviewContainer}>
        <WebView
          ref={webviewRef}
          source={{ uri: portalUrl }}
          style={styles.webview}
          onNavigationStateChange={onNavigationStateChange}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#f59e0b" />
            </View>
          )}
          allowsFullscreenVideo={true}
          allowsInlineMediaPlayback={true}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          bounces={false}
          overScrollMode="never"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827', // Match the portal's dark background
    paddingTop: 24, // basic safe area for status bar
  },
  webviewContainer: {
    flex: 1,
    backgroundColor: '#111827',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
  }
});
