if(NOT TARGET react-native-reanimated::reanimated)
add_library(react-native-reanimated::reanimated SHARED IMPORTED)
set_target_properties(react-native-reanimated::reanimated PROPERTIES
    IMPORTED_LOCATION "/Users/mac/Downloads/ConnectVibe-main/node_modules/react-native-reanimated/android/build/intermediates/cxx/RelWithDebInfo/601p3p1q/obj/x86/libreanimated.so"
    INTERFACE_INCLUDE_DIRECTORIES "/Users/mac/Downloads/ConnectVibe-main/node_modules/react-native-reanimated/android/build/prefab-headers/reanimated"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

if(NOT TARGET react-native-reanimated::worklets)
add_library(react-native-reanimated::worklets SHARED IMPORTED)
set_target_properties(react-native-reanimated::worklets PROPERTIES
    IMPORTED_LOCATION "/Users/mac/Downloads/ConnectVibe-main/node_modules/react-native-reanimated/android/build/intermediates/cxx/RelWithDebInfo/601p3p1q/obj/x86/libworklets.so"
    INTERFACE_INCLUDE_DIRECTORIES "/Users/mac/Downloads/ConnectVibe-main/node_modules/react-native-reanimated/android/build/prefab-headers/worklets"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

