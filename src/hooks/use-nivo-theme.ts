/**
 * Copyright 2025 RAIDS Lab
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { PartialTheme } from '@nivo/theming'

import nivoDarkTheme from '@/components/chart/dark-theme'
import nivoLightTheme from '@/components/chart/default-theme'

import { useTheme } from '@/utils/theme'

/**
 * `useNivoTheme` is a custom hook that returns the Nivo theme based on the current application theme.
 */
const useNivoTheme = (): { nivoTheme: PartialTheme; theme: string } => {
  const { theme } = useTheme()
  return {
    nivoTheme: theme === 'light' ? nivoLightTheme : { ...nivoDarkTheme, background: '#10172a' },
    theme: theme,
  }
}

export default useNivoTheme
