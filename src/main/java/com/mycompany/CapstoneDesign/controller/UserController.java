package com.mycompany.CapstoneDesign.controller;

import javax.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.mycompany.CapstoneDesign.user.UserService;
import com.mycompany.CapstoneDesign.user.UserVO;

@Controller
@RequestMapping("/api/auth") // API prefix 통일
public class UserController {

	@Autowired
	private UserService userService; // 서비스 계층 호출

	// 1.로그인
	@PostMapping("/login")
	@ResponseBody
	public String login(@RequestParam String email, @RequestParam String password, HttpSession session) { // 세션 저장
		UserVO user = userService.findByEmail(email);

		if (user == null) {
			return "EMAIL_NOT_FOUND"; // 이메일이 존재하지 않을 때 반환하는 코드
		}

		if (!userService.checkPassword(password, user.getPassword())) {
			return "WRONG_PASSWORD"; // checkPassword()에서 BCrypt 비교 처리
		}

		session.setAttribute("loginUser", user); // 로그인 성공시 세션에 로그인 사용자 정보 저장.
		return "LOGIN_SUCCESS";
	}

	// 2. 회원가입
	@PostMapping("/signup")
	@ResponseBody
	public String signup(@RequestBody UserVO vo) { // JSON 입력, 회원가입은 json형태로 받기에 RequestBody 사용
		if (userService.existsEmail(vo.getEmail())) {
			return "EMAIL_DUPLICATED"; // 이메일 중복이라면 SIGNUP 실패
		}

		userService.insertUser(vo); // insertUser() 호출, userDAO-> Mapper.xml로
		return "SIGNUP_SUCCESS";
	}

	// 5. 세션 로그아웃
	@GetMapping("logout")
	@ResponseBody
	public String logout(HttpSession session) {
		session.invalidate(); // 로그아웃 시 세션 전부 삭제
		return "LOGOUT_SUCCESS";
	}

//	// 3. 닉네임 변경 , 이건 요청한 바 없는데 만들어주네?
//	@PostMapping("/update-nickname")
//	@ResponseBody
//	public String updataNickname(@RequestParam int user_id, @RequestParam String nickname) {
//
//		if (userService.existsNickname(nickname)) { // 닉네임 중복 체크
//			return "NICKNAME_DUPLICATED";
//		}
//
//		UserVO vo = new UserVO(); // 닉네임 업데이트를 위한 VO 생성
//		vo.setUser_id(user_id);
//		vo.setNickname(nickname);
//
//		userService.updateNickname(vo); // userService ->DAO ->MyBatis update 실행
//
//		return "UPDATE_SUCCESS";
//	}

//	// 4. 이메일 중복 체크
//	@GetMapping("/check-email")
//	@ResponseBody
//	public boolean checkEmail(@RequestParam String email) {
//		return userService.existsEmail(email); // 이메일 중복 여부
//	}

}
