cmake_minimum_required(VERSION 3.14)

set(CMAKE_C_COMPILER "/usr/bin/clang")
set(CMAKE_CXX_COMPILER "/usr/bin/clang++")

# Set the vcpkg toolchain file
set(CMAKE_TOOLCHAIN_FILE "${VCPKG_ROOT}/scripts/buildsystems/vcpkg.cmake" CACHE STRING "Vcpkg toolchain file")

project(LeapTrackerFullHand)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Set the path to your Leap Motion SDK
set(LEAP_SDK_PATH "/Applications/Ultraleap Hand Tracking.app/Contents/LeapSDK")

# Add the path to the tinyosc.h file
set(TINYOSC_INCLUDE_DIR "${CMAKE_SOURCE_DIR}")  # Adjust this if tinyosc.h is in a different directory

# Find required packages
find_package(nlohmann_json CONFIG REQUIRED)
find_package(OpenSSL REQUIRED)
find_package(Threads REQUIRED)
find_package(asio CONFIG REQUIRED)
find_package(websocketpp CONFIG REQUIRED)

# MacOS specific settings
if(APPLE)
    add_compile_options(-Wno-deprecated-declarations)
endif()

# Add source files
set(SOURCES
    main.cpp
    LeapTracker.cpp
    tinyosc.cpp
)

# Add executable
add_executable(LeapTrackerFullHand ${SOURCES})

# Include directories
target_include_directories(LeapTrackerFullHand PRIVATE
    "${LEAP_SDK_PATH}/include"
    "${TINYOSC_INCLUDE_DIR}"
    "${VCPKG_ROOT}/installed/arm64-osx/include"
    ${ASIO_INCLUDE_DIR}
    ${nlohmann_json_INCLUDE_DIRS} 
)

# Link directories
target_link_directories(LeapTrackerFullHand PRIVATE "${LEAP_SDK_PATH}/lib")

# Link libraries
target_link_libraries(LeapTrackerFullHand 
    PRIVATE 
    LeapC
    nlohmann_json::nlohmann_json
    OpenSSL::SSL 
    OpenSSL::Crypto
    Threads::Threads
    asio::asio
    websocketpp::websocketpp
)

# MacOS specific settings
if(APPLE)
    set_target_properties(LeapTrackerFullHand PROPERTIES
        LINK_FLAGS "-Wl,-rpath,\"${LEAP_SDK_PATH}/lib\""
    )
endif()

# Set C++ standard for the target
set_target_properties(LeapTrackerFullHand PROPERTIES
    CXX_STANDARD 17
    CXX_STANDARD_REQUIRED ON
)

# Print some information for debugging
message(STATUS "VCPKG_ROOT: $ENV{VCPKG_ROOT}")
message(STATUS "LEAP_SDK_PATH: ${LEAP_SDK_PATH}")