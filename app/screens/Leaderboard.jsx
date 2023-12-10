import React from 'react';
import { View, StyleSheet } from 'react-native';

const Grid = () => {
  const renderRows = () => {
    const rows = [];
    for (let i = 0; i < 20; i++) {
      rows.push(
        <View key={i} style={styles.row}>
          {renderColumns()}
        </View>
      );
    }
    return rows;
  };

  const renderColumns = () => {
    const columns = [];
    for (let i = 0; i < 20; i++) {
      columns.push(
        <View key={i} style={styles.column}></View>
      );
    }
    return columns;
  };

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {renderRows()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  grid: {
    flexDirection: 'column',
  },
  row: {
    flexDirection: 'row',
  },
  column: {
    width: 15, // Adjust the width as needed
    height: 15, // Adjust the height as needed
    borderWidth: 1,
    borderColor: 'black',
  },
});

export default Grid;