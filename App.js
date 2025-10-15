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

import { userService } from './src/services/api';
import UserCard from './src/components/UseCard';
import Loading from './src/components/Loading';
import { globalStyles } from './src/styles/globalStyles';
import { COLORS } from './src/utils/constants.js';

const App = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Función para cargar usuarios
  const loadUsers = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const usersData = await userService.getUsers();
      setUsers(usersData);
    } catch (err) {
      setError(err.message);
      console.error('Error loading users:', err);
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
      
      <Text style={globalStyles.header}>Lista de Usuarios</Text>
      
      <FlatList
        data={users}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={globalStyles.flatList}
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