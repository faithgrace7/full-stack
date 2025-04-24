import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TextInput,
  Button,
  FlatList,
  TouchableOpacity,
  Switch,
  Appearance,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function App() {
  const colorScheme = Appearance.getColorScheme();
  const [tasks, setTasks] = useState([]);
  const [task, setTask] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [editedTask, setEditedTask] = useState("");
  const [filter, setFilter] = useState("all");
  const [darkMode, setDarkMode] = useState(colorScheme === "dark");

  const API_URL = "https://full-stack-5lot.onrender.com/todos";

  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => setTasks(data))
      .catch((error) => console.error("Error fetching tasks:", error));
  }, []);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem("theme");
        if (storedTheme) {
          setDarkMode(storedTheme === "dark");
        }
      } catch (error) {
        console.error("Failed to load theme from storage", error);
      }
    };
    loadTheme();
  }, []);

  useEffect(() => {
    const saveTheme = async () => {
      try {
        await AsyncStorage.setItem("theme", darkMode ? "dark" : "light");
      } catch (error) {
        console.error("Failed to save theme", error);
      }
    };
    saveTheme();
  }, [darkMode]);

  const addTask = () => {
    if (task.trim() === "") return;
    const newTask = { title: task, completed: false };

    fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTask),
    })
      .then((res) => res.json())
      .then((data) => {
        setTasks([...tasks, data]);
        setTask("");
      })
      .catch((err) => console.error("Error adding task:", err));
  };

  const removeTask = (index) => {
    const taskToDelete = tasks[index];
    fetch(`${API_URL}/${taskToDelete.id}`, {
      method: "DELETE",
    })
      .then(() => {
        setTasks(tasks.filter((_, i) => i !== index));
      })
      .catch((err) => console.error("Error deleting task:", err));
  };

  const toggleComplete = (index) => {
    const taskToUpdate = tasks[index];
    const updatedTask = { ...taskToUpdate, completed: !taskToUpdate.completed };

    fetch(`${API_URL}/${taskToUpdate.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedTask),
    })
      .then((res) => res.json())
      .then((data) => {
        const updatedTasks = [...tasks];
        updatedTasks[index] = data;
        setTasks(updatedTasks);
      })
      .catch((err) => console.error("Error updating task:", err));
  };

  const editTask = (index) => {
    setEditingIndex(index);
    setEditedTask(tasks[index].title);
  };

  const saveEditedTask = (index) => {
    const taskToUpdate = tasks[index];
    const updatedTask = { ...taskToUpdate, title: editedTask };

    fetch(`${API_URL}/${taskToUpdate.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedTask),
    })
      .then((res) => res.json())
      .then((data) => {
        const updatedTasks = [...tasks];
        updatedTasks[index] = data;
        setTasks(updatedTasks);
        setEditingIndex(null);
      })
      .catch((err) => console.error("Error saving edited task:", err));
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === "completed") return task.completed;
    if (filter === "pending") return !task.completed;
    return true;
  });

  return (
    <SafeAreaView style={[styles.container, darkMode && styles.darkContainer]}>
      <View style={styles.toggleContainer}>
        <Text style={[styles.label, darkMode && styles.darkText]}>
          {darkMode ? "🌙 Dark Mode" : "☀️ Light Mode"}
        </Text>
        <Switch
          value={darkMode}
          onValueChange={setDarkMode}
          trackColor={{ false: "#767577", true: "#81b0ff" }}
          thumbColor={darkMode ? "#f5dd4b" : "#f4f3f4"}
        />
      </View>

      <Text style={[styles.title, darkMode && styles.darkText]}>To-Do List</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, darkMode && styles.darkInput]}
          placeholder="Add a new task..."
          placeholderTextColor={darkMode ? "#aaa" : "#555"}
          value={task}
          onChangeText={setTask}
        />
        <View style={{ marginLeft: 8 }}>
          <Button title="Add" onPress={addTask} disabled={!task.trim()} />
        </View>
      </View>

      <View style={styles.filterContainer}>
        {["all", "completed", "pending"].map((type) => (
          <Button
            key={type}
            title={type.charAt(0).toUpperCase() + type.slice(1)}
            onPress={() => setFilter(type)}
            color={filter === type ? "#007AFF" : "#aaa"}
          />
        ))}
      </View>

      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id?.toString() ?? Math.random().toString()}
        renderItem={({ item, index }) => (
          <View style={styles.taskItem}>
            <TouchableOpacity onPress={() => toggleComplete(index)}>
              {editingIndex === index ? (
                <TextInput
                  value={editedTask}
                  onChangeText={setEditedTask}
                  style={[styles.input, styles.editInput]}
                />
              ) : (
                <Text
                  style={[
                    styles.taskText,
                    item.completed && styles.completedText,
                    darkMode && styles.darkText,
                  ]}
                >
                  {item.title}
                </Text>
              )}
            </TouchableOpacity>
            {editingIndex === index ? (
              <Button title="Save" onPress={() => saveEditedTask(index)} />
            ) : (
              <View style={styles.actionButtons}>
                <View style={{ marginRight: 10 }}>
                  <Button title="Edit" onPress={() => editTask(index)} />
                </View>
                <Button title="Delete" onPress={() => removeTask(index)} />
              </View>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
    backgroundColor: "#fff",
  },
  darkContainer: {
    backgroundColor: "#121212",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  darkText: {
    color: "#fff",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  input: {
    flex: 1,
    borderBottomWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderColor: "#ccc",
  },
  darkInput: {
    borderColor: "#555",
    color: "#fff",
  },
  taskItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: "#ccc",
  },
  taskText: {
    fontSize: 16,
  },
  completedText: {
    textDecorationLine: "line-through",
    color: "gray",
  },
  actionButtons: {
    flexDirection: "row",
    marginTop: 5,
  },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  editInput: {
    marginVertical: 5,
    padding: 4,
    fontSize: 16,
    borderBottomWidth: 1,
  },
});
