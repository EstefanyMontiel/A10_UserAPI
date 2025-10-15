import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Alert,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { userService } from './src/services/api';
import UserCard from './src/components/UseCard';
import Loading from './src/components/Loading';
import { globalStyles } from './src/styles/globalStyles';
import { COLORS } from './src/utils/constants.js';

// Clave para almacenar en AsyncStorage
const STORAGE_KEY = '@users_data';
const LAST_UPDATE_KEY = '@last_update';

const App = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  //Función para guardar usuarios en AsyncStorage
  const saveUsersLocally = async (usersData) => {
    try {
      // Convertir array a string JSON
      const jsonValue = JSON.stringify(usersData);
      await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
      
      // Guardar fecha de última actualización
      const timestamp = new Date().toISOString();
      await AsyncStorage.setItem(LAST_UPDATE_KEY, timestamp);
      
      console.log('Usuarios guardados localmente:', usersData.length);
      return true;
    } catch (error) {
      console.error('Error al guardar usuarios:', error);
      return false;
    }
  };

  // cargar usuarios desde AsyncStorage
  const loadUsersFromStorage = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
      
      if (jsonValue !== null) {
        const savedUsers = JSON.parse(jsonValue);
        console.log('Usuarios cargados del almacenamiento local:', savedUsers.length);
        return savedUsers;
      }
      
      return null;
    } catch (error) {
      console.error('Error al cargar usuarios del storage:', error);
      return null;
    }
  };

  // Función para verificar que los datos se guardaron correctamente
  const verifyDataSaved = async (originalData) => {
    try {
      const savedData = await loadUsersFromStorage();
      
      if (!savedData) {
        return false;
      }

      // Verificar que la cantidad de usuarios sea la misma
      if (originalData.length !== savedData.length) {
        return false;
      }

      // Verificar que el primer usuario sea el mismo (validación rápida)
      if (JSON.stringify(originalData[0]) !== JSON.stringify(savedData[0])) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error al verificar datos:', error);
      return false;
    }
  };

  // cargar usuarios (con cache offline)
  const loadUsers = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      setIsOffline(false);
      
      // 1️Intentar cargar desde la API
      try {
        const usersData = await userService.getUsers();
        setUsers(usersData);
        
        // 2Guardar en AsyncStorage
        const savedSuccessfully = await saveUsersLocally(usersData);
        
        // 3Verificar que se guardó correctamente
        if (savedSuccessfully) {
          const isVerified = await verifyDataSaved(usersData);
          
          if (!isVerified) {
            // ⚠️ Si la verificación falla, mostrar alerta
            Alert.alert(
              '⚠️ Error de Guardado',
              'Los datos no se guardaron correctamente en el almacenamiento local. Por favor, conéctate a internet e intenta nuevamente.',
              [
                {
                  text: 'Reintentar',
                  onPress: () => loadUsers(true),
                },
                {
                  text: 'Continuar',
                  style: 'cancel',
                },
              ]
            );
          } else {
            console.log('Datos verificados y guardados correctamente');
          }
        } else {
          // ⚠️ Si falla el guardado
          Alert.alert(
            'Error de Almacenamiento',
            'No se pudieron guardar los datos localmente. Deberás estar conectado a internet para ver los usuarios.',
            [{ text: 'OK' }]
          );
        }
        
      } catch (apiError) {
        // 4️Si falla la API, intentar cargar del almacenamiento local
        console.log('Error en API, intentando cargar desde storage...');
        const cachedUsers = await loadUsersFromStorage();
        
        if (cachedUsers && cachedUsers.length > 0) {
          setUsers(cachedUsers);
          setIsOffline(true);
          
          Alert.alert(
            'Modo Offline',
            'No hay conexión a internet. Mostrando datos guardados localmente.',
            [{ text: 'OK' }]
          );
        } else {
          // 5️No hay datos en cache ni en API
          throw new Error('No hay conexión y no existen datos guardados. Por favor, conéctate a internet.');
        }
      }
      
    } catch (err) {
      setError(err.message);
      console.error('Error loading users:', err);
      
      Alert.alert(
        'Error de Conexión',
        'No se pudieron cargar los usuarios y no hay datos guardados. Por favor, conéctate a internet e intenta nuevamente.',
        [
          {
            text: 'Reintentar',
            onPress: () => loadUsers(),
          },
          {
            text: 'Cancelar',
            style: 'cancel',
          },
        ]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Cargar datos al montar el componente
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Función para manejar el pull-to-refresh
  const onRefresh = useCallback(() => {
    loadUsers(true);
  }, [loadUsers]);

  // Función para manejar el clic en una tarjeta de usuario
  const handleUserPress = (user) => {
    Alert.alert(
      user.name,
      `Email: ${user.email}\nTeléfono: ${user.phone}\nWebsite: ${user.website}`,
      [{ text: 'OK' }]
    );
  };

  // Función para reintentar la carga
  const handleRetry = () => {
    loadUsers();
  };

  // Función para limpiar cache 
  const clearCache = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      await AsyncStorage.removeItem(LAST_UPDATE_KEY);
      Alert.alert('Cache Limpiado', 'Los datos locales han sido eliminados.');
      setUsers([]);
      loadUsers();
    } catch (error) {
      Alert.alert('Error', 'No se pudo limpiar el cache.');
    }
  };

  // Renderizar cada item de la lista
  const renderUserItem = ({ item }) => (
    <UserCard user={item} onPress={() => handleUserPress(item)} />
  );

  // Mostrar estado de carga inicial
  if (loading && !refreshing) {
    return <Loading />;
  }

  // Mostrar estado de error
  if (error && users.length === 0) {
    return (
      <View style={globalStyles.errorContainer}>
        <StatusBar backgroundColor={COLORS.background} barStyle="dark-content" />
        <Text style={globalStyles.errorText}>{error}</Text>
        <TouchableOpacity style={globalStyles.retryButton} onPress={handleRetry}>
          <Text style={globalStyles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={globalStyles.container}>
      <StatusBar backgroundColor={COLORS.background} barStyle="dark-content" />
      
      {/* Indicador de modo offline */}
      {isOffline && (
        <View style={{ backgroundColor: '#FFA500', padding: 10 }}>
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
            📱 Modo Offline - Datos guardados localmente
          </Text>
        </View>
      )}
      
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 }}>
        <Text style={globalStyles.header}>Lista de Usuarios</Text>
        
        {/* Botón para limpiar cache */}
        <TouchableOpacity onPress={clearCache}>
          <Text style={{ color: COLORS.primary, fontSize: 14 }}> Limpiar</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={users}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={globalStyles.flatList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={
          <View style={globalStyles.errorContainer}>
            <Text style={globalStyles.errorText}>No se encontraron usuarios</Text>
          </View>
        }
      />
      
      {error && users.length > 0 && (
        <View style={{ padding: 16 }}>
          <Text style={globalStyles.errorText}>
            Error al actualizar: {error}
          </Text>
        </View>
      )}
    </View>
  );
};

export default App;