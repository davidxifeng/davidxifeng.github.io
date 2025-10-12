import { describe, it, expect, beforeEach } from 'vitest'
import { authManager } from '../api-client/axios-instance'
import { getAuthentication } from '../api-client/endpoints/authentication/authentication'

describe('用户认证完整流程测试', () => {
  const authApi = getAuthentication()

  // 生成随机6位数字
  const randomId = Math.floor(Math.random() * 900000) + 100000

  // 测试用户数据
  const testUser = {
    email: `test${randomId}@example.com`,
    username: `user${randomId}`,
    password: 'TestPassword123',
    display_name: 'Test User'
  }

  let verificationCode: string
  let accessToken: string

  beforeEach(() => {
    // 每个测试前清除 token
    authManager.clearToken()
  })

  it('1. 应该成功请求验证码 (POST /api/auth/verify-code)', async () => {
    const response = await authApi.postAuthVerifyCode({
      email: testUser.email,
      type: 'register'
    })

    expect(response).toBeDefined()
    expect(response.message).toBeDefined()

    // 开发环境下应该返回验证码
    if (response.dev_code) {
      verificationCode = response.dev_code
      console.log('📧 获取到验证码:', verificationCode)
    }

    expect(verificationCode).toBeDefined()
    expect(verificationCode).toMatch(/^\d{6}$/) // 验证码应该是6位数字
  })

  it('2. 应该成功注册新用户 (POST /api/auth/register)', async () => {
    // 先请求验证码
    const verifyCodeResponse = await authApi.postAuthVerifyCode({
      email: testUser.email,
      type: 'register'
    })
    verificationCode = verifyCodeResponse.dev_code!

    // 注册用户
    const response = await authApi.postAuthRegister({
      email: testUser.email,
      username: testUser.username,
      password: testUser.password,
      verification_code: verificationCode,
      display_name: testUser.display_name
    })

    expect(response).toBeDefined()
    expect(response.access_token).toBeDefined()
    expect(response.token_type).toBe('Bearer')
    expect(response.expires_in).toBeGreaterThan(0)

    // 验证用户信息
    expect(response.user).toBeDefined()
    expect(response.user.email).toBe(testUser.email)
    expect(response.user.username).toBe(testUser.username)
    expect(response.user.display_name).toBe(testUser.display_name)
    expect(response.user.email_verified).toBe(true)
    expect(response.user.role).toBe('user')

    // 保存 token 供后续测试使用
    accessToken = response.access_token
    console.log('✅ 注册成功，用户ID:', response.user.id)
  })

  it('3. 应该成功登录 (POST /api/auth/login)', async () => {
    // 先注册一个用户
    const verifyCodeResponse = await authApi.postAuthVerifyCode({
      email: testUser.email,
      type: 'register'
    })
    await authApi.postAuthRegister({
      email: testUser.email,
      username: testUser.username,
      password: testUser.password,
      verification_code: verifyCodeResponse.dev_code!,
      display_name: testUser.display_name
    })

    // 清除注册时的 token
    authManager.clearToken()

    // 使用用户名登录
    const loginResponse = await authApi.postAuthLogin({
      username: testUser.username,
      password: testUser.password
    })

    expect(loginResponse).toBeDefined()
    expect(loginResponse.access_token).toBeDefined()
    expect(loginResponse.token_type).toBe('Bearer')
    expect(loginResponse.user.username).toBe(testUser.username)

    accessToken = loginResponse.access_token
    console.log('✅ 登录成功')
  })

  it('4. 应该成功获取当前用户信息 (GET /api/auth/me)', async () => {
    // 先注册并登录
    const verifyCodeResponse = await authApi.postAuthVerifyCode({
      email: testUser.email,
      type: 'register'
    })
    const registerResponse = await authApi.postAuthRegister({
      email: testUser.email,
      username: testUser.username,
      password: testUser.password,
      verification_code: verifyCodeResponse.dev_code!,
      display_name: testUser.display_name
    })

    // 设置 token
    authManager.setToken(registerResponse.access_token)

    // 获取当前用户信息
    const profile = await authApi.getAuthProfile()

    expect(profile).toBeDefined()
    expect(profile.id).toBeDefined()
    expect(profile.email).toBe(testUser.email)
    expect(profile.username).toBe(testUser.username)
    expect(profile.display_name).toBe(testUser.display_name)
    expect(profile.email_verified).toBe(true)
    expect(profile.role).toBe('user')

    console.log('✅ 获取用户信息成功:', profile.username)
  })

  it('5. 应该成功登出 (POST /api/auth/logout)', async () => {
    // 先注册并登录
    const verifyCodeResponse = await authApi.postAuthVerifyCode({
      email: testUser.email,
      type: 'register'
    })
    const registerResponse = await authApi.postAuthRegister({
      email: testUser.email,
      username: testUser.username,
      password: testUser.password,
      verification_code: verifyCodeResponse.dev_code!,
      display_name: testUser.display_name
    })

    // 设置 token
    authManager.setToken(registerResponse.access_token)

    // 登出
    const logoutResponse = await authApi.postAuthLogout()

    expect(logoutResponse).toBeDefined()
    expect(logoutResponse.message).toBeDefined()

    // 清除本地 token
    authManager.clearToken()

    console.log('✅ 登出成功')
  })

  it('6. 登出后获取用户信息应该失败 (GET /api/auth/me - 期待 401)', async () => {
    // 先注册并登录
    const verifyCodeResponse = await authApi.postAuthVerifyCode({
      email: testUser.email,
      type: 'register'
    })
    const registerResponse = await authApi.postAuthRegister({
      email: testUser.email,
      username: testUser.username,
      password: testUser.password,
      verification_code: verifyCodeResponse.dev_code!,
      display_name: testUser.display_name
    })

    // 设置 token
    authManager.setToken(registerResponse.access_token)

    // 登出
    await authApi.postAuthLogout()

    // 清除 token
    authManager.clearToken()

    // 尝试获取用户信息，应该失败
    try {
      await authApi.getAuthProfile()
      // 如果没有抛出错误，测试失败
      expect.fail('应该抛出 401 错误')
    } catch (error: any) {
      // 验证错误状态码
      expect(error.response).toBeDefined()
      expect(error.response.status).toBe(401)
      expect(error.response.data.error).toBe('Unauthorized')

      console.log('✅ 验证成功：未认证请求被正确拒绝')
    }
  })

  it('7. 完整流程：验证码 -> 注册 -> 登录 -> 获取信息 -> 登出 -> 再次获取（失败）', async () => {
    // Step 1: 请求验证码
    const verifyCodeResponse = await authApi.postAuthVerifyCode({
      email: testUser.email,
      type: 'register'
    })
    expect(verifyCodeResponse.dev_code).toBeDefined()
    console.log('📧 Step 1: 验证码获取成功')

    // Step 2: 注册
    const registerResponse = await authApi.postAuthRegister({
      email: testUser.email,
      username: testUser.username,
      password: testUser.password,
      verification_code: verifyCodeResponse.dev_code!,
      display_name: testUser.display_name
    })
    expect(registerResponse.access_token).toBeDefined()
    console.log('👤 Step 2: 用户注册成功')

    // Step 3: 登录
    authManager.clearToken()
    const loginResponse = await authApi.postAuthLogin({
      username: testUser.username,
      password: testUser.password
    })
    expect(loginResponse.access_token).toBeDefined()
    authManager.setToken(loginResponse.access_token)
    console.log('🔐 Step 3: 用户登录成功')

    // Step 4: 获取用户信息
    const profile = await authApi.getAuthProfile()
    expect(profile.username).toBe(testUser.username)
    console.log('ℹ️  Step 4: 获取用户信息成功')

    // Step 5: 登出
    const logoutResponse = await authApi.postAuthLogout()
    expect(logoutResponse.message).toBeDefined()
    authManager.clearToken()
    console.log('👋 Step 5: 用户登出成功')

    // Step 6: 再次获取用户信息（应该失败）
    try {
      await authApi.getAuthProfile()
      expect.fail('应该抛出 401 错误')
    } catch (error: any) {
      expect(error.response.status).toBe(401)
      console.log('❌ Step 6: 未认证请求被正确拒绝')
    }

    console.log('✅ 完整认证流程测试通过！')
  })
})