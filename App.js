import React, {useEffect, useState} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import {authorize} from 'react-native-app-auth';

const styles = StyleSheet.create({
  header: {
    paddingVertical: 40,
    fontSize: 24,
    textAlign: 'center',
  },
  main: {
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  codeBlock: {
    width: '100%',
    padding: 10,
    flex: 1,
    marginTop: 20,
    backgroundColor: '#eee',
  },
  buttonLogin: {
    backgroundColor: '#1955ff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  buttonLogout: {
    backgroundColor: '#666',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginTop: 40,
  },
  buttonText: {color: 'white', fontSize: 18},
  codeText: {
    fontFamily: 'menlo',
    fontSize: 12,
  },
  balanceText: {
    fontSize: 22,
  },
});

const config = {
  serviceConfiguration: {
    authorizationEndpoint: 'https://eu-dev.api.tru.qa/oauth2/v1/auth',
    tokenEndpoint: 'https://eu-dev.api.tru.qa/oauth2/v1/token',
  },
  clientId: 'mobile_console_eu',
  redirectUrl: 'truidconsole://oauth2redirect/command',
  scopes: ['workspaces', 'projects', 'openid', 'offline_access'],
  additionalParameters: {
    provider_id: 'google',
  },
};

const App = () => {
  const [balance, setBalance] = useState();
  const [currency, setCurrency] = useState();
  const [loggedIn, setLoggedIn] = useState(false);
  const loginWithGoogle = async () => {
    try {
      const result = await authorize(config);
      console.log(JSON.stringify(result));
      await AsyncStorage.setItem('refresh_token', result.refreshToken);
      await AsyncStorage.setItem('access_token', result.accessToken);
      console.log(result.accessTokenExpirationDate);
      await AsyncStorage.setItem('expire_at', result.accessTokenExpirationDate);
      setLoggedIn(true);
    } catch (err) {
      console.log(err);
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('access_token');
    await AsyncStorage.removeItem('refresh_token');
    await AsyncStorage.removeItem('expire_at');
    setLoggedIn(false);
  };

  const fetchWorkspace = async () => {
    const accessToken = await AsyncStorage.getItem('access_token');
    try {
      const res = await fetch(
        'https://eu-dev.api.tru.qa/console/v0.1/workspaces/default',
        {
          method: 'get',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      const json = await res.json();
      setBalance(json._embedded.balance.amount_available);
      setCurrency(json._embedded.balance.currency);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (loggedIn) {
      fetchWorkspace();
    }
  }, [loggedIn]);

  useEffect(() => {
    AsyncStorage.getItem('access_token').then(accessToken => {
      if (accessToken) {
        setLoggedIn(true);
      }
    });
  }, []);

  return (
    <SafeAreaView>
      <StatusBar barStyle={'dark-content'} />
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <Text style={styles.header}>tru.ID mobile console</Text>
        <View style={styles.main}>
          {loggedIn ? (
            <>
              <Text style={styles.balanceText}>
                Balance: {balance} {currency}
              </Text>
              <TouchableOpacity onPress={logout} style={styles.buttonLogout}>
                <Text style={styles.buttonText}>Logout</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              onPress={loginWithGoogle}
              style={styles.buttonLogin}>
              <Text style={styles.buttonText}>Login with Google</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default App;
