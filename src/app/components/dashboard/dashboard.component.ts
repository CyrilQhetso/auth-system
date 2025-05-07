import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { User } from '../../models/user.model';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

  currentUser: User | null = null;
  
  constructor(
    private router: Router,
    private authService: AuthService
  ) { }
  
  ngOnInit() {
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
    });

    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const dropdown = document.querySelector('.dropdown');
      const dropdownMenu = document.querySelector('.dropdown-menu');

      if (dropdown && dropdownMenu) {
        if (dropdown.contains(target) && !dropdownMenu.contains(target)) {
          dropdownMenu.classList.toggle('show');
        } else if (!dropdown.contains(target)) {
          dropdownMenu.classList.remove('show');
        }
      }
    })
  }
  
  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
