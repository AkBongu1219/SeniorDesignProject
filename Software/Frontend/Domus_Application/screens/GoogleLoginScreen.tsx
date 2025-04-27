import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useAuth } from '../AuthContext';

const GoogleLoginScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn } = useAuth();

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);

      await GoogleSignin.hasPlayServices();
      await signIn(); // uses context logic (already sets user)

    } catch (error: any) {
      console.error('Sign in error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);

      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        setError('Sign in cancelled');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        setError('Play services not available');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        setError('Sign in already in progress');
      } else {
        setError(`Sign in error: ${error.message}`);
      }

      await GoogleSignin.signOut();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../assets/app-icon.png')} 
            style={styles.logo} 
            resizeMode="contain"
          />
        </View>
        
        <TouchableOpacity 
          style={styles.googleButton}
          onPress={handleGoogleSignIn}
          disabled={loading}
        >
          <View style={styles.googleIconContainer}>
            <Image 
              source={require('../assets/google-icon.png')} 
              style={styles.googleIcon}
            />
          </View>
          <Text style={styles.googleButtonText}>
            {loading ? 'Signing in...' : 'Sign in with Google'}
          </Text>
          {loading && <ActivityIndicator color="#fff" style={styles.loader} />}
        </TouchableOpacity>

        {error && (
          <Text style={styles.error}>{error}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#fefcf2',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10, // pushes everything slightly down
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 10, // small space between logo and button
  },
  logo: {
    width: 300,
    height: 300,
  },
  title: { 
    fontSize: 28,
    marginBottom: 30,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4285F4',
    borderRadius: 4,
    paddingVertical: 12,
    paddingRight: 24,
    paddingLeft: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  googleIconContainer: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 2,
    marginRight: 24,
    marginLeft: 12,
  },
  googleIcon: {
    width: 18,
    height: 18,
  },
  googleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  loader: {
    marginLeft: 10
  },
  error: { 
    color: 'red',
    textAlign: 'center',
  },
});

export default GoogleLoginScreen;
