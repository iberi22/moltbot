import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_client/theme/app_theme.dart';
import 'package:flutter_client/screens/chat_screen.dart';
import 'package:flutter_client/screens/settings_screen.dart';
import 'package:flutter_client/screens/overview_screen.dart';
import 'package:flutter_client/screens/logs_screen.dart';

void main() {
  runApp(const ProviderScope(child: MoltbotApp()));
}

class MoltbotApp extends StatelessWidget {
  const MoltbotApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Moltbot Client',
      theme: AppTheme.darkTheme,
      home: const MainScreen(),
      debugShowCheckedModeBanner: false,
    );
  }
}

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _currentIndex = 0;

  final List<Widget> _screens = [
    const ChatScreen(),
    const OverviewScreen(),
    const LogsScreen(),
    const SettingsScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth > 800) {
          // Desktop / Tablet layout with NavigationDrawer
          return Scaffold(
            body: Row(
              children: [
                NavigationDrawer(
                  selectedIndex: _currentIndex,
                  onDestinationSelected: (index) {
                    setState(() {
                      _currentIndex = index;
                    });
                  },
                  children: const [
                    Padding(
                      padding: EdgeInsets.fromLTRB(28, 16, 16, 10),
                      child: Text(
                        'MOLTBOT',
                        style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 2.0),
                      ),
                    ),
                    NavigationDrawerDestination(
                      icon: Icon(Icons.chat_bubble_outline),
                      selectedIcon: Icon(Icons.chat_bubble),
                      label: Text('Chat'),
                    ),
                    NavigationDrawerDestination(
                      icon: Icon(Icons.dashboard_outlined),
                      selectedIcon: Icon(Icons.dashboard),
                      label: Text('Overview'),
                    ),
                    NavigationDrawerDestination(
                      icon: Icon(Icons.terminal_outlined),
                      selectedIcon: Icon(Icons.terminal),
                      label: Text('Logs'),
                    ),
                    Divider(),
                    NavigationDrawerDestination(
                      icon: Icon(Icons.settings_outlined),
                      selectedIcon: Icon(Icons.settings),
                      label: Text('Settings'),
                    ),
                  ],
                ),
                Expanded(
                  child: _screens[_currentIndex],
                ),
              ],
            ),
          );
        } else {
          // Mobile layout with BottomNavigationBar
          return Scaffold(
            body: IndexedStack(
              index: _currentIndex,
              children: _screens,
            ),
            bottomNavigationBar: NavigationBar(
              selectedIndex: _currentIndex,
              onDestinationSelected: (index) {
                setState(() {
                  _currentIndex = index;
                });
              },
              destinations: const [
                NavigationDestination(
                  icon: Icon(Icons.chat_bubble_outline),
                  selectedIcon: Icon(Icons.chat_bubble),
                  label: 'Chat',
                ),
                NavigationDestination(
                  icon: Icon(Icons.dashboard_outlined),
                  selectedIcon: Icon(Icons.dashboard),
                  label: 'Overview',
                ),
                NavigationDestination(
                  icon: Icon(Icons.terminal_outlined),
                  selectedIcon: Icon(Icons.terminal),
                  label: 'Logs',
                ),
                NavigationDestination(
                  icon: Icon(Icons.settings_outlined),
                  selectedIcon: Icon(Icons.settings),
                  label: 'Settings',
                ),
              ],
            ),
          );
        }
      },
    );
  }
}
