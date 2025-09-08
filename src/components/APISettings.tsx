import { useState, useEffect } from 'react'
import { Settings, X, Check, AlertCircle, Key, Globe, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useAPIConfigStore, API_PROVIDERS } from '@/stores/apiConfigStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'

export function APISettings() {
  const [isOpen, setIsOpen] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle')
  
  const {
    selectedProviderId,
    customBaseURL,
    apiKey,
    model,
    temperature,
    maxTokens,
    currentProvider,
    effectiveBaseURL,
    effectiveModel,
    availableModels,
    isLoadingModels,
    modelsError,
    setProvider,
    setCustomBaseURL,
    setAPIKey,
    setModel,
    setTemperature,
    setMaxTokens,
    resetToDefaults,
    loadAvailableModels,
    setAvailableModels,
    setModelsError
  } = useAPIConfigStore()

  // Load models when dialog opens and provider is available
  useEffect(() => {
    if (isOpen && effectiveBaseURL && !isLoadingModels) {
      console.log('Loading models for provider:', selectedProviderId, 'URL:', effectiveBaseURL)
      loadAvailableModels()
    }
  }, [isOpen, effectiveBaseURL, selectedProviderId])

  // Load models when provider changes (even when dialog is closed)
  useEffect(() => {
    if (effectiveBaseURL && !isLoadingModels) {
      console.log('Provider changed, loading models for:', selectedProviderId, 'URL:', effectiveBaseURL)
      loadAvailableModels()
    }
  }, [selectedProviderId, effectiveBaseURL])

  const testConnection = async () => {
    if (!effectiveBaseURL) return

    setTestingConnection(true)
    setConnectionStatus('idle')

    try {
      await loadAvailableModels()
      setConnectionStatus('success')
    } catch (error) {
      setConnectionStatus('error')
    } finally {
      setTestingConnection(false)
      setTimeout(() => setConnectionStatus('idle'), 3000)
    }
  }

  const handleLoadModels = async () => {
    console.log('Manual refresh clicked')
    // Clear current models and force reload
    setAvailableModels([])
    setModelsError(null)
    await loadAvailableModels()
  }

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg z-50"
      >
        <Settings className="h-5 w-5" />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>API Settings</CardTitle>
                    <CardDescription>
                      Configure your AI API connection
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Provider Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="provider">API Provider</Label>
                    <Select value={selectedProviderId} onValueChange={setProvider}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select API Provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {API_PROVIDERS.map((provider) => (
                          <SelectItem key={provider.id} value={provider.id}>
                            <div className="flex items-center gap-2">
                              {provider.requiresKey ? <Key className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                              {provider.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Custom Base URL (for custom provider) */}
                  {selectedProviderId === 'custom' && (
                    <div className="space-y-2">
                      <Label htmlFor="baseurl">Base URL</Label>
                      <Input
                        id="baseurl"
                        type="url"
                        value={customBaseURL}
                        onChange={(e) => setCustomBaseURL(e.target.value)}
                        placeholder="https://your-api.example.com/v1"
                      />
                    </div>
                  )}

                  {/* API Key (if required) */}
                  {currentProvider.requiresKey && (
                    <div className="space-y-2">
                      <Label htmlFor="apikey">API Key</Label>
                      <Input
                        id="apikey"
                        type="password"
                        value={apiKey}
                        onChange={(e) => setAPIKey(e.target.value)}
                        placeholder="Enter your API key"
                      />
                      {selectedProviderId === 'openrouter' && (
                        <p className="text-xs text-muted-foreground">
                          Get your API key from{' '}
                          <a
                            href="https://openrouter.ai/keys"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline"
                          >
                            OpenRouter Dashboard
                          </a>
                        </p>
                      )}
                    </div>
                  )}

                  {/* Model Selection */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="model">Model</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLoadModels}
                        disabled={isLoadingModels}
                        className="h-6 px-2"
                      >
                        <RefreshCw className={`h-3 w-3 ${isLoadingModels ? 'animate-spin' : ''}`} />
                        <span className="ml-1 text-xs">Refresh</span>
                      </Button>
                    </div>
                    
                    {modelsError && (
                      <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                        {modelsError}
                      </div>
                    )}
                    
                    {availableModels.length > 0 ? (
                      <Select 
                        value={model && availableModels.includes(model) ? model : availableModels[0]} 
                        onValueChange={setModel}
                      >
                        <SelectTrigger>
                          <SelectValue 
                            placeholder={isLoadingModels ? "Loading models..." : "Select Model"} 
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {availableModels.map((modelName) => (
                            <SelectItem key={modelName} value={modelName}>
                              <div className="flex flex-col">
                                <span className="font-mono text-sm">{modelName}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : !isLoadingModels ? (
                      <Input
                        id="model"
                        value={model || currentProvider.defaultModel || ''}
                        onChange={(e) => setModel(e.target.value)}
                        placeholder="Enter model name manually"
                      />
                    ) : (
                      <div className="flex items-center justify-center p-3 border rounded-md bg-muted">
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        <span className="text-sm text-muted-foreground">Loading models...</span>
                      </div>
                    )}
                    
                    {availableModels.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {availableModels.length} models available
                      </div>
                    )}
                  </div>

                  {/* Temperature */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Temperature</Label>
                      <span className="text-sm text-muted-foreground">{temperature}</span>
                    </div>
                    <Slider
                      value={[temperature]}
                      onValueChange={(value) => setTemperature(value[0])}
                      max={2}
                      min={0}
                      step={0.1}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Controls randomness. Lower values make output more focused and deterministic.
                    </p>
                  </div>

                  {/* Max Tokens */}
                  <div className="space-y-2">
                    <Label htmlFor="maxTokens">Max Tokens</Label>
                    <Input
                      id="maxTokens"
                      type="number"
                      value={maxTokens}
                      onChange={(e) => setMaxTokens(parseInt(e.target.value) || 4096)}
                      min={1}
                      max={8192}
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum number of tokens to generate (1-8192).
                    </p>
                  </div>

                  {/* Connection Info */}
                  <div className="rounded-lg bg-muted p-4 space-y-2">
                    <h4 className="font-medium">Connection Info</h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p><strong>Provider ID:</strong> {selectedProviderId}</p>
                      <p><strong>Provider:</strong> {currentProvider.name}</p>
                      <p><strong>Base URL:</strong> {effectiveBaseURL || 'Not set'}</p>
                      <p><strong>Resolved URL:</strong> {effectiveBaseURL?.startsWith('/') ? `${window.location.origin}${effectiveBaseURL}` : effectiveBaseURL || 'Not set'}</p>
                      <p><strong>Current Model:</strong> {model || 'None selected'}</p>
                      <p><strong>Effective Model:</strong> {effectiveModel}</p>
                      <p><strong>Available Models:</strong> {availableModels.length > 0 ? availableModels.length : 'None loaded'}</p>
                      <p><strong>Loading:</strong> {isLoadingModels ? 'Yes' : 'No'}</p>
                      <p><strong>Error:</strong> {modelsError || 'None'}</p>
                      <p><strong>Auth:</strong> {currentProvider.requiresKey ? (apiKey ? '✓ API Key Set' : '⚠ API Key Required') : '✓ No Auth Required'}</p>
                    </div>
                  </div>

                  {/* Test Connection */}
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={testConnection}
                      disabled={testingConnection || (!effectiveBaseURL)}
                      variant="outline"
                    >
                      {testingConnection ? 'Testing...' : 'Test Connection'}
                    </Button>
                    
                    {connectionStatus === 'success' && (
                      <div className="flex items-center gap-1 text-green-600">
                        <Check className="h-4 w-4" />
                        <span className="text-sm">Connected</span>
                      </div>
                    )}
                    
                    {connectionStatus === 'error' && (
                      <div className="flex items-center gap-1 text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">Connection Failed</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-between pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={resetToDefaults}
                    >
                      Reset to Defaults
                    </Button>
                    
                    <Button onClick={() => setIsOpen(false)}>
                      Save Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}