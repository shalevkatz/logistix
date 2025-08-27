import React from 'react'
import { Image, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { styles as s } from '../styles/SignUpScreen.style'


const SignUpScreen = () => {
  return (
    <View style={s.root}>
      <Image source={require('../assets/images/Vector_1.png')} style={s.waveTop} resizeMode='cover' />
      <Image source={require('../assets/images/Vector_2.png')} style={s.waveBottom} resizeMode='contain' />

      <SafeAreaView edges={['top']} style={s.safe}>
              <View style={s.content}>

                {/* Title */}
                <View style={s.titleGroup}>
                <Text style={s.title}>Create Account</Text>
                </View>

                {/* Form */}
                <View style={s.formGroup}>
                </View>
              </View>
            </SafeAreaView>
            </View>
  )
}

export default SignUpScreen