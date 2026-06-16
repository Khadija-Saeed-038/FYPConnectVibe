if(NOT TARGET hermes-engine::libhermes)
add_library(hermes-engine::libhermes SHARED IMPORTED)
set_target_properties(hermes-engine::libhermes PROPERTIES
    IMPORTED_LOCATION "/Users/awais/.gradle/caches/8.12/transforms/69080e43184dc1c9c94b095ba5a35e01/transformed/hermes-android-0.78.0-release/prefab/modules/libhermes/libs/android.x86_64/libhermes.so"
    INTERFACE_INCLUDE_DIRECTORIES "/Users/awais/.gradle/caches/8.12/transforms/69080e43184dc1c9c94b095ba5a35e01/transformed/hermes-android-0.78.0-release/prefab/modules/libhermes/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

