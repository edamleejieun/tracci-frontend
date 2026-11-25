/**
 * 账号绑定相关 API 错误码常量
 *
 * 对应后端 RESTful-API设计契约.md 中的业务错误码段。
 * 统一引用以避免魔法数字和语义漂移。
 */

/** 验证码错误或过期 */
export const ERR_CODE_INVALID = 40001

/** 参数格式错误 */
export const ERR_CODE_BAD_PARAM = 40002

/** 该信息已被其他账号绑定 */
export const ERR_CODE_ALREADY_BOUND = 40010

/** 请先绑定其他登录方式后再解绑 */
export const ERR_CODE_NEED_OTHER_LOGIN = 40012

/** 请先设置密码后再操作 */
export const ERR_CODE_NEED_PASSWORD = 40009

/** 操作过于频繁 */
export const ERR_CODE_RATE_LIMITED = 42901

/** 当前账号仍是共同旅程 owner，需先转让所有权再注销 */
export const ERR_CODE_TRIP_OWNERSHIP_REQUIRED = 42240
