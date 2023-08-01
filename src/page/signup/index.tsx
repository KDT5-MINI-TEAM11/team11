import { useCallback, useState } from 'react';
import { Button, Input, Form, Select, Card, Upload, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { EMAIL_REGEX, PASSWORD_REGEX, POSITIONS } from '@/data/constants';
import { RuleObject } from 'antd/es/form';
import { handleUpload } from '@/api/cloudinary';
import { signup } from '@/api/signup';
import { checkEmail } from '@/api/checkEmail';
import { verificationEmail } from '@/api/verification';

interface valuseType {
  confirm_password: string;
  phone: string;
  position: string;
  profileThumbUrl: any;
  userEmail: string;
  userPassword: string;
  userName: string;
}

export default function SingUp() {
  const [isEmailCehck, setIsEmailCheck] = useState(false);
  const [verification, setVerification] = useState(false);
  const navigate = useNavigate();
  const { Option } = Select;
  const [form] = Form.useForm();

  const onFinish = async (values: valuseType) => {
    const imageUrl = await getImageUrl(values);

    const newValues = {
      ...values,
      profileThumbUrl: imageUrl,
    };

    try {
      const response = await signup(newValues);
      if (response.status === 200) {
        const data = response.data;
        navigate('/'); // 회원가입이 성공한 경우 홈으로 이동
        return data;
      }
      throw new Error('회원가입에 실패했습니다.');
    } catch (error) {
      console.error('오류 발생:', error);
    }

    console.log(newValues);
  };

  const getImageUrl = async (values: valuseType) => {
    let imageUrl: any = null;

    try {
      if (values.profileThumbUrl && values.profileThumbUrl.length > 0) {
        const response = await handleUpload(
          values.profileThumbUrl[0].originFileObj,
        );
        if (response?.status === 200) {
          const data = response.data;
          imageUrl = data.url; // 이미지 URL을 받아옴
        } else {
          throw new Error('이미지 업로드에 실패하였습니다.');
        }
      }
    } catch (error) {
      console.error('오류 발생:', error);
      imageUrl = null; // 오류가 발생했으므로 imageUrl을 null로 설정
    }

    return imageUrl;
  };

  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  // 이메일 유효성 검사
  const validateEmail = useCallback((_: RuleObject, value: string) => {
    if (!value || EMAIL_REGEX.test(value)) {
      return Promise.resolve();
    }
    return Promise.reject(new Error('올바른 형식의 메일을 입력해주세요.'));
  }, []);

  // 비밀번호 유효성 검사
  const validatePassword = useCallback((_: RuleObject, value: string) => {
    const NUMBER_REGEX = /\d/;
    const SPECIAL_REGEX = /[!@#$%^&*()-+=]/;
    const ENGLISH_REGEX = /[a-zA-Z]/;

    if (!value) {
      return Promise.reject(new Error('비밀번호를 입력해주세요.'));
    }

    if (!NUMBER_REGEX.test(value) && !ENGLISH_REGEX.test(value)) {
      return Promise.reject(
        new Error(
          '비밀번호에는 최소 하나의 숫자와 영어 대소문자가 포함되어야 합니다.',
        ),
      );
    }

    if (!SPECIAL_REGEX.test(value) && !ENGLISH_REGEX.test(value)) {
      return Promise.reject(
        new Error(
          '비밀번호에는 최소 하나의 특수문자와 영어 대소문자가 포함되어야 합니다.',
        ),
      );
    }

    if (!NUMBER_REGEX.test(value) && !SPECIAL_REGEX.test(value)) {
      return Promise.reject(
        new Error(
          '비밀번호에는 최소 하나의 숫자와 특수문자가 포함되어야 합니다.',
        ),
      );
    }

    if (!NUMBER_REGEX.test(value)) {
      return Promise.reject(
        new Error('비밀번호에는 최소 하나의 숫자가 포함되어야 합니다.'),
      );
    }

    if (!SPECIAL_REGEX.test(value)) {
      return Promise.reject(
        new Error('비밀번호에는 최소 하나의 특수문자가 포함되어야 합니다.'),
      );
    }

    if (!ENGLISH_REGEX.test(value)) {
      return Promise.reject(
        new Error(
          '비밀번호에는 최소 하나의 영어 대소문자가 포함되어야 합니다.',
        ),
      );
    }

    if (!PASSWORD_REGEX.test(value)) {
      return Promise.reject(new Error('비밀번호는 8~16자 입니다.'));
    }

    return Promise.resolve();
  }, []);

  // 직급 선택 동적으로 생성
  const selectedPositionOptions = Object.keys(POSITIONS).map((key) => {
    return (
      <Option key={key} value={key}>
        {POSITIONS[key].label}
      </Option>
    );
  });

  const handleCheckEmail = async () => {
    try {
      const values = await form.validateFields(['userEmail']);
      const userEmail = values.userEmail;
      const response = await checkEmail(userEmail);

      // 이메일 중복 여부에 따라 메시지 출력
      if (response.data.isDuplicate) {
        message.error('이미 사용 중인 이메일입니다.');
      } else {
        message.success('사용 가능한 이메일입니다.');
      }
    } catch (error) {
      message.error('이메일 중복 체크 중 오류가 발생했습니다.');
    } finally {
      setIsEmailCheck(true);
    }
  };

  const hnadleverificationEmail = async () => {
    try {
      const values = await form.validateFields(['userEmail']);
      const userEmail = values.userEmail;
      const response = await verificationEmail(userEmail);

      if (response.status === 200) {
        message.success('인증번호를 발송했습니다.');
      } else {
        message.warning('이메일을 다시 확인해주세요.');
      }
    } catch (error) {
      message.error('인증번호 발송에 오류가 발생했습니다.');
    } finally {
      setVerification(true);
    }
  };

  return (
    <Card bordered={false} style={{ margin: '0px 20px', width: 400 }}>
      <Form
        form={form}
        layout="vertical"
        name="basic"
        wrapperCol={{ span: 30, offset: 0 }}
        style={{ maxWidth: 350 }}
        onFinish={onFinish}
        autoComplete="off"
      >
        <Form.Item
          label="이름"
          name="userName"
          rules={[{ required: true, message: '이름을 입력해주세요.' }]}
        >
          <Input allowClear />
        </Form.Item>
        <Form.Item
          label="이메일"
          name="userEmail"
          rules={[
            { required: true, message: '이메일을 입력해주세요.' },
            { validator: validateEmail },
          ]}
        >
          <Input placeholder="ex) anyone123@email.com" allowClear />
        </Form.Item>

        <Form.Item>
          {isEmailCehck ? (
            verification ? (
              // 인증 번호 입력 창과 제출 버튼
              <div>
                <Input placeholder="인증 번호를 입력해주세요." />
                <Button type="primary" style={{ marginTop: 20 }}>
                  제출
                </Button>
              </div>
            ) : (
              // 인증 번호 전송 버튼
              <Button type="primary" onClick={hnadleverificationEmail}>
                인증 번호 전송
              </Button>
            )
          ) : (
            // 이메일 중복 체크 버튼
            <Button type="primary" onClick={handleCheckEmail}>
              이메일 중복 체크
            </Button>
          )}
        </Form.Item>

        <Form.Item
          label="비밀번호 (영문, 숫자, 특수문자를 포함해주세요.)"
          name="userPassword"
          rules={[{ required: true, validator: validatePassword }]}
          hasFeedback
        >
          <Input.Password
            placeholder="비밀번호는 8자리 이상 16자리 미만입니다."
            allowClear
          />
        </Form.Item>

        <Form.Item
          label="비밀번호 확인"
          name="confirm_password"
          dependencies={['userPassword']}
          hasFeedback
          rules={[
            { required: true, message: '비밀번호를 입력해주세요' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('userPassword') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error('비밀번호가 일치하지 않습니다.'),
                );
              },
            }),
          ]}
        >
          <Input.Password allowClear />
        </Form.Item>
        <Form.Item
          label="연락처 (ex. 01012345678)"
          name="phoneNumber"
          rules={[{ required: true, message: '연락처를 입력해주세요.' }]}
        >
          <Input
            style={{ width: '100%' }}
            placeholder="하이픈(-)없이 01012345678"
            allowClear
          />
        </Form.Item>

        <Form.Item
          label="프로필"
          name="profileThumbUrl"
          valuePropName="fileList"
          getValueFromEvent={normFile}
        >
          <Upload beforeUpload={() => false}>
            <Button>
              <PlusOutlined /> Click to Upload
            </Button>
          </Upload>
        </Form.Item>

        <Form.Item
          name="position"
          label="직급"
          rules={[{ required: true, message: '직급을 선택해주세요.' }]}
        >
          <Select
            placeholder="-직급-"
            style={{ width: 85, textAlign: 'center' }}
          >
            {selectedPositionOptions}
          </Select>
        </Form.Item>

        <Button
          type="primary"
          htmlType="submit"
          size="large"
          style={{ width: '100%' }}
        >
          회원가입
        </Button>
      </Form>
    </Card>
  );
}
